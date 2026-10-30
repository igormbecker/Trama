import { randomUUID } from "node:crypto";
import session from "models/session.js";
import impersonation from "models/impersonation.js";
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors.js";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log(`\n Error in: ${request.url}`);
  console.log(error);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(response, session) {
  const expiresAt = new Date(session.expires_at);
  const maxAge = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );
  const attributes = [
    `trama_session_id=${encodeURIComponent(session.token)}`,
    `Max-Age=${maxAge}`,
    `Expires=${expiresAt.toUTCString()}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  response.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(response) {
  setSessionCookie(response, {
    token: "",
    expires_at: new Date(0),
  });
}

// Record metadata only; never persist request bodies, cookies, or query strings.
function withImpersonationAudit(handler) {
  return async (request, response) => {
    let context;
    const requestId = randomUUID();
    const track =
      !["GET", "HEAD", "OPTIONS"].includes(request.method) ||
      /\/export(?:\?|$)/u.test(request.url || "");
    if (track && request.cookies?.trama_session_id) {
      try {
        const current = await session.findOneValidByToken(
          request.cookies.trama_session_id,
        );
        if (current.impersonated_user_id) {
          context = current;
        }
        if (context) {
          await impersonation.record(context, "request_started", {
            request_id: requestId,
            method: request.method,
            path: (request.url || "")
              .split("?")[0]
              .replace(/[a-f0-9]{96}/giu, "[token]"),
          });
        }
      } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
          return onErrorHandler(error, request, response);
        }
      }
    }
    try {
      return await handler(request, response);
    } finally {
      if (context) {
        try {
          await impersonation.record(
            context,
            request.method === "DELETE" &&
              request.url?.split("?")[0] === "/api/v1/sessions"
              ? "logout"
              : "request_finished",
            {
              request_id: requestId,
              method: request.method,
              status_code: response.statusCode,
            },
          );
        } catch {
          console.error("Could not record impersonation request outcome.");
        }
      }
    }
  };
}

const controller = {
  withImpersonationAudit,
  setSessionCookie,
  clearSessionCookie,
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
