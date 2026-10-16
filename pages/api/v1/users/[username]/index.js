import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authentication from "models/authentication.js";

const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.administrator = await authentication.authenticateAdministrator(
    request.cookies?.trama_session_id,
  );
  await next();
});
router.get(getHandler);
router.patch(patchHandler);
router.delete(deleteHandler);
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  return response
    .status(200)
    .json(user.toPublic(await user.findOneByUsername(request.query.username)));
}
async function patchHandler(request, response) {
  return response
    .status(200)
    .json(
      user.toPublic(await user.update(request.query.username, request.body)),
    );
}
async function deleteHandler(request, response) {
  await user.remove(request.query.username, request.administrator.id);
  return response.status(204).end();
}
