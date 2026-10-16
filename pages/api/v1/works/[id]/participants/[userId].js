import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import workParticipant from "models/workParticipant.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.delete(async (request, response) => {
  await workParticipant.remove(
    request.query.id,
    request.query.userId,
    request.authenticatedUser.id,
  );
  return response.status(204).end();
});
export default router.handler(controller.errorHandlers);
