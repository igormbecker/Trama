import InvitationPage from "components/works/InvitationPage";
import authentication from "models/authentication.js";
import workInvitation from "models/workInvitation.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";

export default InvitationPage;
export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  let currentUser;
  try {
    currentUser = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return { props: { user: null, invitation: null } };
    throw error;
  }
  let invitation = null;
  try {
    invitation = await workInvitation.findForUser(params.token, currentUser.id);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }
  return {
    props: {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        is_admin: currentUser.is_admin,
      },
      invitation: invitation ? JSON.parse(JSON.stringify(invitation)) : null,
    },
  };
}
