import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");

  const authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );

  return response.status(200).json({
    id: authenticatedUser.id,
    name: authenticatedUser.name,
    username: authenticatedUser.username,
    email: authenticatedUser.email,
    created_at: authenticatedUser.created_at,
    updated_at: authenticatedUser.updated_at,
  });
}

async function patchHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");
  const currentUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  const updatedUser = await user.updateOwnAccount(currentUser, request.body);
  return response.status(200).json(user.toPublic(updatedUser));
}
