import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authentication from "models/authentication.js";
import { waitUntil } from "@vercel/functions";
import emailVerification from "models/emailVerification.js";

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
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);

async function getHandler(request, response) {
  return response
    .status(200)
    .json(user.toPublic(await user.findOneByUsername(request.query.username)));
}
async function patchHandler(request, response) {
  const updatedUser = await user.update(request.query.username, request.body, {
    allowRoleChange: true,
    requirePasswordConfirmation: true,
  });
  if (
    updatedUser.email_verification_required &&
    !updatedUser.email_verified_at
  ) {
    emailVerification.queue(updatedUser.email, waitUntil);
  }
  return response.status(200).json(user.toPublic(updatedUser));
}
async function deleteHandler(request, response) {
  await user.remove(request.query.username, request.administrator.id);
  return response.status(204).end();
}
