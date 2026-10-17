import authentication from "models/authentication.js";
import workReading from "models/workReading.js";
import { UnauthorizedError, NotFoundError } from "infra/errors.js";
export { default } from "components/works/WorkReadingPage";

export async function getServerSideProps({ req, res, params }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    const user = await authentication.authenticateSession(
      req.cookies?.trama_session_id,
    );
    const reading = await workReading.read(params.id, user.id);
    return {
      props: JSON.parse(
        JSON.stringify({
          ...reading,
          user: { id: user.id, name: user.name, is_admin: user.is_admin },
        }),
      ),
    };
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return { redirect: { destination: "/login", permanent: false } };
    if (error instanceof NotFoundError) return { notFound: true };
    throw error;
  }
}
