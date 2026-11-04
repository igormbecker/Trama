import workCredits from "models/workCredits.js";
import { readProgress } from "models/readingProgress.js";
import {
  isNarrationEnabled,
  narrationBlocks,
  narrationRevision,
} from "models/chapterNarration.js";
import authentication from "models/authentication.js";
import workReading from "models/workReading.js";
import {
  LegalAcceptanceRequiredError,
  UnauthorizedError,
  NotFoundError,
} from "infra/errors.js";
export { default } from "components/works/WorkReadingPage";

export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    const reading = await workReading.read(params.id, user.id);
    const { authors } = await workCredits.findConfirmed(reading.work.id);
    const progress = await readProgress(user.id, reading.work.id);
    const canNarrate = user.is_admin && isNarrationEnabled();
    const narration = {};
    if (canNarrate) {
      for (const part of reading.parts) {
        for (const chapter of part.chapters) {
          const blocks = narrationBlocks(chapter.title, chapter.document);
          narration[chapter.id] = {
            blocks,
            revision: narrationRevision(blocks),
          };
        }
      }
    }
    return {
      props: JSON.parse(
        JSON.stringify({
          ...reading,
          authors,
          canNarrate,
          narration,
          progress: canNarrate
            ? progress
            : { reading: progress.reading ?? null },
          user: { id: user.id, name: user.name, is_admin: user.is_admin },
        }),
      ),
    };
  } catch (error) {
    if (error instanceof LegalAcceptanceRequiredError) {
      return { redirect: { destination: "/legal/accept", permanent: false } };
    }
    if (error instanceof UnauthorizedError) {
      return { redirect: { destination: "/login", permanent: false } };
    }
    if (error instanceof NotFoundError) {
      return { notFound: true };
    }
    throw error;
  }
}
