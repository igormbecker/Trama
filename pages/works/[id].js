import workInvitation from "models/workInvitation.js";
import workParticipant from "models/workParticipant.js";
import WorkPage from "components/works/WorkPage";
import authentication from "models/authentication.js";
import work from "models/work.js";
import workStructure from "models/workStructure.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";

export default WorkPage;

export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const currentUser = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    const ownedWork = await work.findOneById(params.id, currentUser.id);
    const isOwner = ownedWork.owner_id === currentUser.id;
    const participants = isOwner
      ? await workParticipant.findAll(params.id, currentUser.id)
      : [];
    const invitations = isOwner
      ? await workInvitation.findAll(params.id, currentUser.id)
      : [];
    return {
      props: {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          is_admin: currentUser.is_admin,
        },
        work: JSON.parse(JSON.stringify(ownedWork)),
        parts: JSON.parse(
          JSON.stringify(
            await workStructure.findAll(params.id, currentUser.id),
          ),
        ),
        participants: JSON.parse(JSON.stringify(participants)),
        invitations: JSON.parse(
          JSON.stringify(
            invitations.filter((invitation) => invitation.status === "pending"),
          ),
        ),
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { redirect: { destination: "/login", permanent: false } };
    }
    if (error instanceof NotFoundError) {
      return { notFound: true };
    }
    throw error;
  }
}
