import InvitationsPage from "components/works/InvitationsPage";
import authentication from "models/authentication.js";
import workInvitation from "models/workInvitation.js";
import { UnauthorizedError } from "infra/errors.js";

export default InvitationsPage;
export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    return {
      props: {
        user: { id: user.id, name: user.name, is_admin: user.is_admin },
        invitations: JSON.parse(
          JSON.stringify(await workInvitation.findPendingForAccount(user.id)),
        ),
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return { redirect: { destination: "/login", permanent: false } };
    throw error;
  }
}
