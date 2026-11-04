import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import authentication from "models/authentication.js";
import workReading from "models/workReading.js";
import {
  narrationBlocks,
  narrationRevision,
  narrationVoices,
} from "models/chapterNarration.js";
import { validPosition, writeProgress } from "models/readingProgress.js";

const router = createRouter();

router.put(async (request, response) => {
  response.setHeader("Cache-Control", "private, no-store");
  const user = await authentication.authenticateSession(
    request.cookies?.trama_session_id,
  );
  const { chapterId, voice, position } = request.body ?? {};
  const reading = await workReading.read(request.query.id, user.id);
  const chapter = reading.parts
    .flatMap((part) => part.chapters)
    .find((entry) => String(entry.id) === String(chapterId));
  if (!chapter || (voice && !user.is_admin)) {
    throw new NotFoundError({ message: "Chapter not found." });
  }

  let slot = "reading";
  let saved;
  if (voice) {
    const blocks = narrationBlocks(chapter.title, chapter.document);
    if (
      !narrationVoices.includes(voice) ||
      (position !== null &&
        (!validPosition(position, blocks.length) ||
          position.revision !== narrationRevision(blocks)))
    ) {
      throw new ValidationError({ message: "Invalid narration position." });
    }
    slot = `audio:${chapter.id}:${voice}`;
    saved =
      position === null
        ? null
        : {
            block: position.block,
            seconds: position.seconds,
            revision: position.revision,
          };
  } else {
    if (
      !validPosition(position) ||
      typeof position.anchor !== "string" ||
      !position.anchor ||
      position.anchor.length > 200
    ) {
      throw new ValidationError({ message: "Invalid reading marker." });
    }
    saved = { index: position.index, anchor: position.anchor };
  }

  await writeProgress(user.id, reading.work.id, chapter.id, slot, saved);
  return response.status(204).end();
});

export const config = { api: { bodyParser: { sizeLimit: "2kb" } } };
export default controller.withImpersonationAudit(
  router.handler(controller.errorHandlers),
);
