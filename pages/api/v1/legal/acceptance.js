import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import legalAcceptance from "models/legalAcceptance.js";
import { ForbiddenError } from "infra/errors.js";
const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.headers.origin) {
    let origin;
    try {
      origin = new URL(request.headers.origin);
    } catch {
      throw new ForbiddenError();
    }
    if (origin.host !== request.headers.host) {
      throw new ForbiddenError();
    }
  }
  request.currentUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
    { allowPendingLegalAcceptance: true },
  );
  return next();
});
router.get(async (request, response) =>
  response.status(200).json({
    ...(await legalAcceptance.status(request.currentUser.id)),
    impersonating: Boolean(request.currentUser.impersonation),
  }),
);
router.post(async (request, response) =>
  response
    .status(200)
    .json(await legalAcceptance.accept(request.currentUser, request.body)),
);
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
