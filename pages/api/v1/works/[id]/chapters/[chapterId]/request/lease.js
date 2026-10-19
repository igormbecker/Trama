import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import chapterRequest from "models/chapterRequest.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.post(async (request, response) =>
  response
    .status(200)
    .json(
      await chapterRequest.reserve(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
router.delete(async (request, response) => {
  await chapterRequest.release(
    request.query.id,
    request.query.chapterId,
    request.authenticatedUser.id,
    request.body,
  );
  return response.status(204).end();
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
