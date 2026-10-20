import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import workInvitation from "models/workInvitation.js";
import { waitUntil } from "@vercel/functions";
import emailVerification from "models/emailVerification.js";

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
router.post(async (request, response) => {
  const account = await workInvitation.register(
    request.query.token,
    request.body,
  );
  emailVerification.queue(account.email, waitUntil);
  return response.status(202).json({
    message:
      "If registration is available, check your email to continue. Otherwise, sign in or recover your password.",
  });
});

export default router.handler(controller.errorHandlers);
