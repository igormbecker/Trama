import WorkPage from "components/works/WorkPage";
import authentication from "models/authentication.js";
import work from "models/work.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";

export default WorkPage;

export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const currentUser = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    const ownedWork = await work.findOneById(params.id, currentUser.id);
    return {
      props: {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          is_admin: currentUser.is_admin,
        },
        work: JSON.parse(JSON.stringify(ownedWork)),
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
