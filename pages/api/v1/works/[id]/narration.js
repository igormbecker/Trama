import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import authentication from "models/authentication.js";
import workReading from "models/workReading.js";
import { cachedNarration } from "models/narrationAudio.js";
import {
  defaultNarrationVoice,
  isNarrationEnabled,
  narrate,
  narrationBlocks,
  narrationRevision,
  narrationVoices,
} from "models/chapterNarration.js";

const router = createRouter();
router.use((request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  return next();
});

router.post(async (request, response) => {
  const user = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  if (!user.is_admin || !isNarrationEnabled()) {
    throw new NotFoundError({ message: "Narration is unavailable." });
  }

  const {
    chapterId,
    voice = defaultNarrationVoice,
    block = 0,
  } = request.body ?? {};
  const reading = await workReading.read(request.query.id, user.id);
  const chapter = reading.parts
    .flatMap((part) => part.chapters)
    .find((entry) => String(entry.id) === chapterId);
  if (!chapter) {
    throw new NotFoundError({ message: "Chapter not found." });
  }
  if (!narrationVoices.includes(voice)) {
    throw new ValidationError({ message: "Invalid narration voice." });
  }

  const blocks = narrationBlocks(chapter.title, chapter.document);
  if (!blocks.length || blocks.join("\n").length > 12000) {
    throw new ValidationError({
      message:
        "A leitura em voz alta aceita capítulos de 1 a 12.000 caracteres.",
    });
  }

  if (!Number.isInteger(block) || block < 0 || block >= blocks.length) {
    throw new ValidationError({ message: "Trecho inválido." });
  }

  if (request.body?.revision !== narrationRevision(blocks)) {
    return response.status(409).json({
      message: "O capítulo mudou. Atualize a página para ouvir a versão atual.",
    });
  }

  const generation = new AbortController();
  const cancel = () => generation.abort();
  response.once("close", cancel);
  if (response.destroyed) {
    cancel();
  }

  try {
    const text =
      request.body?.resumeIntro === true
        ? "Continuando leitura..."
        : blocks[block];
    const audio = await cachedNarration(
      { workId: request.query.id, chapterId, voice, text },
      () => narrate(text, voice, generation.signal),
    );
    generation.signal.throwIfAborted();
    if (!audio) {
      return response.status(503).json({
        message: "Outro áudio está sendo gerado. Tente novamente em instantes.",
      });
    }
    response.setHeader("X-Narration-Blocks", blocks.length);
    response.setHeader("Content-Type", "audio/wav");
    return response.status(200).send(audio);
  } catch (error) {
    if (!generation.signal.aborted) {
      throw error;
    }
  } finally {
    response.off("close", cancel);
  }
});

export const config = {
  maxDuration: 180,
  api: { responseLimit: false, bodyParser: { sizeLimit: "1kb" } },
};
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
