import { renderToStaticMarkup } from "react-dom/server";
import AcceptancePage from "components/legal/AcceptancePage";
import LegalText from "components/legal/LegalText";
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock(
  "components/home/HomeLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);
jest.mock(
  "components/auth/LogoutButton",
  () =>
    function Logout() {
      return <button>Sair</button>;
    },
);

test("Starts with an unchecked checkbox, disabled acceptance and a refusal option", () => {
  const html = renderToStaticMarkup(
    <AcceptancePage
      user={{ name: "Reader" }}
      legalStatus={{ release_id: "v1", enabled: true }}
    />,
  );
  expect(html).toContain('type="checkbox"');
  expect(html).not.toContain('checked=""');
  expect(html).toContain('type="submit" disabled=""');
  expect(html).toContain("Não aceitar agora");
  expect(html).toContain("/legal/support");
});
test("Does not offer acceptance on behalf of a represented account", () => {
  const html = renderToStaticMarkup(
    <AcceptancePage
      user={{ name: "Reader" }}
      legalStatus={{ release_id: "v1", enabled: true }}
      impersonating
    />,
  );
  expect(html).toContain("não pode aceitar documentos em nome de outra pessoa");
  expect(html).not.toContain('type="submit"');
});
test("Renders legal text without executing HTML or unsafe links", () => {
  const html = renderToStaticMarkup(
    <LegalText
      content={
        "# Documento\n\n<script>alert(1)</script> [link](javascript:alert)\n\n| Campo | Uso |\n| --- | --- |\n| Nome | Conta |"
      }
    />,
  );
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain('href="javascript:');
  expect(html).toContain("<table>");
});
