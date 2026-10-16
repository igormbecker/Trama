import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");

  const userInputValues = request.body;
  const authenticatedUser = await authentication.authenticate(
    userInputValues.email,
    userInputValues.password,
  );
  const createdSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(response, createdSession);

  return response.status(201).json({
    id: createdSession.id,
    token: createdSession.token,
    expires_at: createdSession.expires_at,
    created_at: createdSession.created_at,
    updated_at: createdSession.updated_at,
  });
}

async function deleteHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");

  await session.expireByToken(request.cookies?.trama_session_id);
  controller.clearSessionCookie(response);

  return response.status(204).end();
}
