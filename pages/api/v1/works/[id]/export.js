import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import work from "models/work.js";
import workReading from "models/workReading.js";
import workCredits from "models/workCredits";
import { generateDocx, generatePdf } from "models/workExport.js";
import { ValidationError } from "infra/errors.js";
const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.get(async (request, response) => {
  const format = request.query.format;
  if (!["docx", "pdf"].includes(format)) {
    throw new ValidationError({ message: "Choose docx or pdf." });
  }
  await work.requireOwner(request.query.id, request.authenticatedUser.id);
  const reading = await workReading.read(
    request.query.id,
    request.authenticatedUser.id,
  );
  reading.credits = await workCredits.findConfirmed(request.query.id);
  const buffer = await (format === "docx"
    ? generateDocx(reading)
    : generatePdf(reading));
  const filename = `${
    reading.work.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .slice(0, 100)
      .replace(/^-|-$/g, "") || "obra"
  }.${format}`;
  response.setHeader(
    "Content-Type",
    format === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  response.status(200).send(buffer);
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
