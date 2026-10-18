import { renderToStaticMarkup } from "react-dom/server";
import UsersPage from "components/users/UsersPage";
jest.mock("next/router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);

test("Offers impersonation only for other regular accounts", () => {
  const admin = {
    id: "admin",
    name: "Admin",
    username: "admin",
    email: "admin@example.test",
    is_admin: true,
  };
  const target = {
    id: "target",
    name: "Reader",
    username: "reader",
    email: "reader@example.test",
    is_admin: false,
  };
  const otherAdmin = {
    ...admin,
    id: "other",
    name: "Other admin",
    username: "other",
  };
  const html = renderToStaticMarkup(
    <UsersPage user={admin} initialUsers={[admin, target, otherAdmin]} />,
  );
  expect(html).toContain('aria-label="Personificar Reader"');
  expect(html).not.toContain('aria-label="Personificar Admin"');
  expect(html).not.toContain('aria-label="Personificar Other admin"');
});
