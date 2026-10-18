import legalAcceptance from "models/legalAcceptance.js";
import { NotFoundError } from "infra/errors.js";
export { default } from "components/legal/LegalDocumentPage";
export async function getServerSideProps({ query, res }) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    return {
      props: {
        kind: "privacy",
        document: await legalAcceptance.document("privacy", query.version),
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) return { notFound: true };
    throw error;
  }
}
