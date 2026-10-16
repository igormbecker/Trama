import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import workStructure from "models/workStructure.js";
const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.patch(async (request, response) =>
  response
    .status(200)
    .json(
      await workStructure.updateChapter(
        request.query.id,
        request.query.partId,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export default router.handler(controller.errorHandlers);
