import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import quickDraft from "models/quickDraft.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.post(async (request, response) => {
  const { created, ...draft } = await quickDraft.create(
    request.authenticatedUser.id,
    request.body,
  );
  return response.status(created ? 201 : 200).json(draft);
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
