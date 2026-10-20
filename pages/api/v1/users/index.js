import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authentication from "models/authentication.js";
import { waitUntil } from "@vercel/functions";
import emailVerification from "models/emailVerification.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);

async function postHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");
  await authentication.authenticateAdministrator(
    request.cookies?.trama_session_id,
  );
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);
  emailVerification.queue(newUser.email, waitUntil);
  return response.status(201).json({
    id: newUser.id,
    name: newUser.name,
    username: newUser.username,
    email: newUser.email,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  });
}

async function getHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");
  await authentication.authenticateAdministrator(
    request.cookies?.trama_session_id,
  );
  return response.status(200).json(await user.findAll());
}
