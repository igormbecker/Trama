import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import voiceTranscription from "models/voiceTranscription.js";
import { maximumAudioBytes } from "infra/transcription.js";
import { ValidationError } from "infra/errors.js";

export const config = { api: { bodyParser: false }, maxDuration: 60 };
const router = createRouter();
router.use(async (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  request.authenticatedUser = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  return next();
});
router.post(async (request, response) => {
  // A custom header prevents cross-origin HTML forms from consuming the shared quota.
  if (
    request.headers["x-trama-voice"] !== "1" ||
    request.headers["sec-fetch-site"] === "cross-site"
  ) {
    throw new ValidationError({ message: "Origem de gravação inválida." });
  }
  const type = request.headers["content-type"] || "";
  if (!/^audio\/(webm|mp4|ogg|wav)(;|$)/i.test(type)) {
    throw new ValidationError({ message: "Formato de áudio inválido." });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumAudioBytes) {
      return response
        .status(413)
        .json({ message: "A gravação ultrapassa 4 MB." });
    }
    chunks.push(chunk);
  }
  if (!size) {
    throw new ValidationError({ message: "A gravação está vazia." });
  }
  const result = await voiceTranscription.create(
    request.authenticatedUser.id,
    Buffer.concat(chunks),
    type,
  );
  return response.status(200).json(result);
});
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
