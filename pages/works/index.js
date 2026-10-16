import WorksPage from "components/works/WorksPage";
import authentication from "models/authentication.js";
import { UnauthorizedError } from "infra/errors.js";

export default WorksPage;

export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");

  try {
    const authenticatedUser = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );

    return {
      props: {
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          is_admin: authenticatedUser.is_admin,
        },
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        redirect: { destination: "/login", permanent: false },
      };
    }

    throw error;
  }
}
