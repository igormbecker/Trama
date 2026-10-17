import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import workStructure from "models/workStructure.js";
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
      await workStructure.listParts(
        request.query.id,
        request.authenticatedUser.id,
      ),
    ),
);
router.post(async (request, response) =>
  response
    .status(201)
    .json(
      await workStructure.createPart(
        request.query.id,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
router.patch(async (request, response) =>
  response
    .status(200)
    .json(
      await workStructure.reorder(
        request.query.id,
        request.authenticatedUser.id,
        request.body,
      ),
    ),
);
export default router.handler(controller.errorHandlers);
