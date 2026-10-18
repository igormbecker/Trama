import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import workInvitation from "models/workInvitation.js";
import { ValidationError } from "infra/errors.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.get(async (request, response) =>
  response
    .status(200)
    .json(
      await workInvitation.findPendingForAccount(request.authenticatedUser.id),
    ),
);
router.post(async (request, response) => {
  const input = request.body;
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 2 ||
    !Object.hasOwn(input, "invitation_id") ||
    !Object.hasOwn(input, "action")
  ) {
    throw new ValidationError({ message: "Invalid invitation action." });
  }
  return response
    .status(200)
    .json(
      await workInvitation.respondById(
        input.invitation_id,
        request.authenticatedUser.id,
        { action: input.action },
      ),
    );
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
