import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator.js";
import authentication from "models/authentication.js";

const router = createRouter();

router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  await authentication.authenticateAdministrator(
    request.cookies?.trama_session_id,
  );
  await next();
});

router.get(getHandler);
router.post(postHandler);

export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();
  // Se alguma migration foi executada, retornamos 201, caso contrário, retornamos 200
  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(migratedMigrations);
}
