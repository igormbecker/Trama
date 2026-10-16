import AccountPage from "components/account/AccountPage";
import authentication from "models/authentication.js";
import user from "models/user.js";
import { UnauthorizedError } from "infra/errors.js";
export default AccountPage;

export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const currentUser = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    return { props: { user: user.toPublic(currentUser) } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { redirect: { destination: "/login", permanent: false } };
    }
    throw error;
  }
}
