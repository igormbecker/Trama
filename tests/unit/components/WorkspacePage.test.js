import { renderToStaticMarkup } from "react-dom/server";
import WorkspacePage from "components/home/WorkspacePage";
import useInvitations from "components/works/useInvitations";

jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);
jest.mock("components/works/useInvitations", () => jest.fn());

test("Introduces the workspace without inventing recent works or pending invitations", () => {
  useInvitations.mockReturnValue({ data: [] });
  const html = renderToStaticMarkup(
    <WorkspacePage user={{ id: "user", name: "Alice" }} works={[]} />,
  );
  expect(html).toContain("Seu espaço");
  expect(html).toContain("Continue de onde parou");
  expect(html).toContain("Carregando seus últimos acessos");
  expect(html).toContain("Ver todos os projetos");
  expect(html).not.toContain("convite para responder");
});

test("Shows a pending invitation only when the current account has one", () => {
  useInvitations.mockReturnValue({ data: [{ id: "invitation" }] });
  const html = renderToStaticMarkup(
    <WorkspacePage user={{ id: "user", name: "Alice" }} works={[]} />,
  );
  expect(html).toContain("convite para responder");
  expect(html).toContain('href="/invitations"');
});
