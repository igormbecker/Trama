import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import chapterContent from "models/chapterContent.js";
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
      await chapterContent.read(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
      ),
    ),
);
router.put(async (request, response) =>
  response
    .status(200)
    .json(
      await chapterContent.save(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export const config = { api: { bodyParser: { sizeLimit: "1100kb" } } };
export default router.handler(controller.errorHandlers);
