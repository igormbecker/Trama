import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import { ForbiddenError } from "infra/errors.js";
import user from "models/user.js";
import { waitUntil } from "@vercel/functions";
import emailVerification from "models/emailVerification.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);

async function getHandler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");

  const authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
    { allowPendingLegalAcceptance: true },
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
  if (currentUser.impersonation) {
    throw new ForbiddenError();
  }
  const updatedUser = await user.updateOwnAccount(currentUser, request.body);
  if (
    updatedUser.email_verification_required &&
    !updatedUser.email_verified_at
  ) {
    emailVerification.queue(updatedUser.email, waitUntil);
  }
  return response.status(200).json(user.toPublic(updatedUser));
}
