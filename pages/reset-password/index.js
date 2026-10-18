import dynamic from "next/dynamic";

// The token comes from a URL fragment, available only in the browser.
const ResetPasswordPage = dynamic(
  () => import("components/auth/ResetPasswordPage"),
  {
    ssr: false,
    loading: () => <p role="status">Carregando link de recuperação...</p>,
  },
);

export default ResetPasswordPage;

export function getServerSideProps({ res }) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  return { props: {} };
}
