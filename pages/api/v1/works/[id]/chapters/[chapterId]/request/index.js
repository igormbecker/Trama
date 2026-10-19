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
router.get(async (request, response) =>
  response
    .status(200)
    .json(
      await chapterRequest.read(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.query.requestId,
      ),
    ),
);
router.post(async (request, response) =>
  response
    .status(201)
    .json(
      await chapterRequest.create(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
router.put(async (request, response) =>
  response
    .status(200)
    .json(
      await chapterRequest.save(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
router.patch(async (request, response) =>
  response
    .status(200)
    .json(
      await chapterRequest.act(
        request.query.id,
        request.query.chapterId,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export const config = { api: { bodyParser: { sizeLimit: "1100kb" } } };
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
