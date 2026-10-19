import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import workInvitation from "models/workInvitation.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.get(async (request, response) =>
  response
    .status(200)
    .json(
      await workInvitation.findAll(
        request.query.id,
        request.authenticatedUser.id,
      ),
    ),
);
router.post(async (request, response) =>
  response
    .status(201)
    .json(
      await workInvitation.createAndSend(
        request.query.id,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
