import TrashPage from "components/works/TrashPage";
import authentication from "models/authentication.js";
import projectTrash from "models/projectTrash.js";
import {
  LegalAcceptanceRequiredError,
  UnauthorizedError,
} from "infra/errors.js";

export default TrashPage;
export async function getServerSideProps({ req, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    return {
      props: {
        user: { id: user.id, name: user.name, is_admin: user.is_admin },
        items: JSON.parse(JSON.stringify(await projectTrash.list(user.id))),
      },
    };
  } catch (error) {
    if (error instanceof LegalAcceptanceRequiredError)
      return { redirect: { destination: "/legal/accept", permanent: false } };
    if (error instanceof UnauthorizedError)
      return { redirect: { destination: "/login", permanent: false } };
    throw error;
  }
}
