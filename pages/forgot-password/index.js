export { default } from "components/auth/ForgotPasswordPage";

export function getServerSideProps({ res }) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  return { props: {} };
}
