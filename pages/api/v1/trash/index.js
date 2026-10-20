import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import projectTrash from "models/projectTrash.js";

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
    .json(await projectTrash.list(request.authenticatedUser.id)),
);
router.delete(async (request, response) => {
  await projectTrash.removePermanently(
    request.authenticatedUser.id,
    request.body,
  );
  return response.status(204).end();
});
router.post(async (request, response) =>
  response
    .status(200)
    .json(
      await projectTrash.restore(request.authenticatedUser.id, request.body),
    ),
);
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
