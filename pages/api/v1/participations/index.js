import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";
import chapterRequest from "models/chapterRequest";
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
    .json(await chapterRequest.findForAssignee(request.authenticatedUser.id)),
);
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
