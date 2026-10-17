import { renderToStaticMarkup } from "react-dom/server";
import AppLayout from "components/app/AppLayout";
jest.mock(
  "components/home/HomeLayout",
  () =>
    function Layout({ navigation, children }) {
      return (
        <>
          {navigation}
          {children}
        </>
      );
    },
);
jest.mock(
  "components/auth/LogoutButton",
  () =>
    function Logout() {
      return <button>Sair</button>;
    },
);
jest.mock("components/works/useInvitations", () => () => ({ data: [] }));

test("Provides an accessible menu toggle while keeping page content available", () => {
  const html = renderToStaticMarkup(
    <AppLayout user={{ id: "user", name: "Alice" }}>Page content</AppLayout>,
  );
  expect(html).toContain('aria-controls="account-sidebar"');
  expect(html).toContain('aria-expanded="true"');
  expect(html).toContain("Ocultar menu");
  expect(html).toContain('id="account-sidebar"');
  expect(html).toContain("Page content");
});
