import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";
import workCredits from "models/workCredits";
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
      await workCredits.read(request.query.id, request.authenticatedUser.id),
    ),
);
router.put(async (request, response) =>
  response
    .status(200)
    .json(
      await workCredits.update(
        request.query.id,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
