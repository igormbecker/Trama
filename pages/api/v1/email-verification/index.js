import { createRouter } from "next-connect";
import { waitUntil } from "@vercel/functions";
import controller from "infra/controller.js";
import emailVerification from "models/emailVerification.js";
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
      if (current.impersonated_user_id) {
        throw new ForbiddenError();
      }
    } catch (error) {
      if (!(error instanceof UnauthorizedError)) {
        throw error;
      }
    }
  }
  return next();
});
router.post((request, response) => {
  const address = emailVerification.validateRequest(request.body);
  emailVerification.queue(address, waitUntil);
  return response
    .status(202)
    .json({ message: "If verification is pending, an email will be sent." });
});
router.patch(async (request, response) => {
  await emailVerification.confirm(request.body);
  return response.status(204).end();
});
export default router.handler(controller.errorHandlers);
