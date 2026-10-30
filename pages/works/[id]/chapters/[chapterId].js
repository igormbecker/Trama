import authentication from "models/authentication.js";
import work from "models/work.js";
import chapterContent from "models/chapterContent.js";
import chapterRequest from "models/chapterRequest.js";
import workParticipant from "models/workParticipant.js";
import {
  LegalAcceptanceRequiredError,
  UnauthorizedError,
  NotFoundError,
} from "infra/errors.js";
import ChapterPage from "components/works/ChapterPage";

export default ChapterPage;
export async function getServerSideProps({ req, res, params, query }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    const ownedWork = await work.findOneById(params.id, user.id);
    const content = await chapterContent.read(
      params.id,
      params.chapterId,
      user.id,
    );
    let requestContent = null;
    try {
      requestContent = await chapterRequest.read(
        params.id,
        params.chapterId,
        user.id,
        query?.requestId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
    const participants =
      ownedWork.owner_id === user.id
        ? await workParticipant.findAll(params.id, user.id)
        : [];
    return {
      props: JSON.parse(
        JSON.stringify({
          user: { id: user.id, name: user.name, is_admin: user.is_admin },
          work: ownedWork,
          content,
          requestContent,
          participants,
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
