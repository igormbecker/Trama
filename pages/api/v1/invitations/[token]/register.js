import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import workInvitation from "models/workInvitation.js";

const router = createRouter();
router.use((request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  return next();
});
router.get(async (request, response) =>
  response
    .status(200)
    .json(await workInvitation.findForRegistration(request.query.token)),
);
router.post(async (request, response) =>
  response
    .status(201)
    .json(await workInvitation.register(request.query.token, request.body)),
);

export default router.handler(controller.errorHandlers);
