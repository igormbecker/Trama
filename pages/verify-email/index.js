import dynamic from "next/dynamic";

// The token is read from the fragment, which is never sent to the server.
const EmailVerificationPage = dynamic(
  () => import("components/auth/EmailVerificationPage"),
  {
    ssr: false,
    loading: () => <p role="status">Carregando confirmação de e-mail…</p>,
  },
);
export default EmailVerificationPage;

export function getServerSideProps({ res }) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  return { props: {} };
}
