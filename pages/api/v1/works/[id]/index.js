import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import work from "models/work.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.get(async (request, response) => {
  return response
    .status(200)
    .json(
      await work.findOneById(request.query.id, request.authenticatedUser.id),
    );
});
router.patch(async (request, response) => {
  return response
    .status(200)
    .json(
      await work.update(
        request.query.id,
        request.authenticatedUser.id,
        request.body,
      ),
    );
});
export default router.handler(controller.errorHandlers);
