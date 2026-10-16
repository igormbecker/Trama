import RegistrationPage from "components/auth/RegistrationPage";
import authentication from "models/authentication.js";
import { UnauthorizedError } from "infra/errors.js";

export default RegistrationPage;

export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");

  try {
    await authentication.authenticateSession(req.cookies?.trama_session_id);

    return {
      redirect: { destination: "/works", permanent: false },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { props: {} };
    }

    throw error;
  }
}
