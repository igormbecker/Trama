import InvitationRegistrationPage from "components/works/InvitationRegistrationPage";
import authentication from "models/authentication.js";
import workInvitation from "models/workInvitation.js";
import {
  LegalAcceptanceRequiredError,
  NotFoundError,
  UnauthorizedError,
} from "infra/errors.js";

export default InvitationRegistrationPage;

export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  try {
    await authentication.authenticateSession(req.cookies?.trama_session_id);
    return {
      redirect: {
        destination: `/invitations/${params.token}`,
        permanent: false,
      },
    };
  } catch (error) {
    if (error instanceof LegalAcceptanceRequiredError) {
      return { redirect: { destination: "/legal/accept", permanent: false } };
    }
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }
  }
  try {
    const invitation = await workInvitation.findForRegistration(params.token);
    return { props: { invitation: JSON.parse(JSON.stringify(invitation)) } };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { notFound: true };
    }
    throw error;
  }
}
