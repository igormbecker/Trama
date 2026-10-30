import authentication from "models/authentication.js";
import legalAcceptance from "models/legalAcceptance.js";
import { UnauthorizedError } from "infra/errors.js";
export { default } from "components/legal/AcceptancePage";
export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const current = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
      { allowPendingLegalAcceptance: true },
    );
    const status = await legalAcceptance.status(current.id);
    if (status.enabled && !status.required) {
      return { redirect: { destination: "/home", permanent: false } };
    }
    return {
      props: {
        user: { id: current.id, name: current.name },
        legalStatus: status,
        impersonating: Boolean(current.impersonation),
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { redirect: { destination: "/login", permanent: false } };
    }
    throw error;
  }
}
