import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";

const router = createRouter();

router.get(getHandler);

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
