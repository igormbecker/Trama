import { createRouter } from "next-connect";
import { waitUntil } from "@vercel/functions";
import controller from "infra/controller.js";
import passwordRecovery from "models/passwordRecovery.js";
import session from "models/session.js";
import { ForbiddenError, UnauthorizedError } from "infra/errors.js";

const router = createRouter();

router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  if (request.cookies?.trama_session_id) {
    try {
      const current = await session.findOneValidByToken(
        request.cookies.trama_session_id,
      );
      if (current.impersonated_user_id) throw new ForbiddenError();
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) throw error;
    }
  }
  await next();
});

router.post(async (request, response) => {
  passwordRecovery.validateRequest(request.body);
  waitUntil(
    passwordRecovery.request(request.body).catch(() => {
      console.error("Could not complete password recovery email delivery.");
    }),
  );
  return response
    .status(202)
    .json({ message: "If an account exists, a recovery email will be sent." });
});

router.patch(async (request, response) => {
  const account = await passwordRecovery.reset(request.body);
  waitUntil(
    passwordRecovery.notifyPasswordChanged(account).catch(() => {
      console.error("Could not send the password change notification.");
    }),
  );
  controller.clearSessionCookie(response);
  return response.status(204).end();
});

export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
