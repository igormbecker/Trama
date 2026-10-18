import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import impersonation from "models/impersonation.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();
router.use((request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  if (request.headers.origin) {
    let host;
    try {
      host = new URL(request.headers.origin).host;
    } catch {
      throw new ForbiddenError();
    }
    if (host !== request.headers.host) throw new ForbiddenError();
  }
  return next();
});
router.get(async (request, response) =>
  response
    .status(200)
    .json(await impersonation.status(request.cookies?.trama_session_id)),
);
router.post(async (request, response) => {
  await impersonation.start(
    request.cookies?.trama_session_id,
    request.body?.user_id ?? null,
  );
  return response.status(201).json({ active: true });
});
router.delete(async (request, response) => {
  await impersonation.stop(request.cookies?.trama_session_id);
  return response.status(204).end();
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
