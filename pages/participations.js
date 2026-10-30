import ParticipationsPage from "components/works/ParticipationsPage";
import authentication from "models/authentication";
import chapterRequest from "models/chapterRequest";
import { LegalAcceptanceRequiredError, UnauthorizedError } from "infra/errors";

export default ParticipationsPage;
export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    return {
      props: {
        user: { id: user.id, name: user.name, is_admin: user.is_admin },
        participations: JSON.parse(
          JSON.stringify(await chapterRequest.findForAssignee(user.id)),
        ),
      },
    };
  } catch (error) {
    if (error instanceof LegalAcceptanceRequiredError) {
      return { redirect: { destination: "/legal/accept", permanent: false } };
    }
    if (error instanceof UnauthorizedError) {
      return { redirect: { destination: "/login", permanent: false } };
    }
    throw error;
  }
}
