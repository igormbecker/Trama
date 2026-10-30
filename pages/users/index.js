import UsersPage from "components/users/UsersPage";
import authentication from "models/authentication.js";
import user from "models/user.js";
import {
  LegalAcceptanceRequiredError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors.js";

export default UsersPage;

export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const administrator = await authentication.authenticateAdministrator(
      req.cookies?.trama_session_id,
    );
    return {
      props: {
        user: {
          id: administrator.id,
          name: administrator.name,
          is_admin: administrator.is_admin,
        },
        initialUsers: await user.findAll(),
      },
    };
  } catch (error) {
    if (error instanceof LegalAcceptanceRequiredError) {
      return { redirect: { destination: "/legal/accept", permanent: false } };
    }
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return {
        redirect: {
          destination: error instanceof UnauthorizedError ? "/login" : "/works",
          permanent: false,
        },
      };
    }
    throw error;
  }
}
