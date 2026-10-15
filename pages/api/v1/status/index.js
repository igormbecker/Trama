import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updateAt = new Date().toISOString();
  const dbVersionResult = await database.query(`SHOW server_version;`);
  const dbMaxConnectionsResult = await database.query(`SHOW max_connections;`);
  const dbName = process.env.POSTGRES_DB || "local_db";
  const dbOpenedConnResult = await database.query({
    text: `SELECT COUNT(*)::int AS opened_connections FROM pg_stat_activity WHERE datname = $1;`,
    values: [dbName],
  });

  response.status(200).json({
    updated_at: updateAt,
    dependencies: {
      database: {
        version: dbVersionResult.rows[0].server_version,
        max_connections: parseInt(
          dbMaxConnectionsResult.rows[0].max_connections,
        ),
        opened_connections: dbOpenedConnResult.rows[0].opened_connections,
      },
    },
  });
}
