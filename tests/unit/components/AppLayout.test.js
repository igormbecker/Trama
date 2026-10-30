import { renderToStaticMarkup } from "react-dom/server";
import AppLayout from "components/app/AppLayout";
import useParticipations from "components/works/useParticipations";
jest.mock("components/works/useParticipations", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: [] })),
  needsParticipationAction: (item) => item.status === "writing",
}));
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
  expect(html).toContain('href="/participations"');
  expect(html).toContain("Minhas participações");
});

test("Provides a floating return shortcut when the page has a parent", () => {
  const html = renderToStaticMarkup(
    <AppLayout
      user={{ id: "user", name: "Alice" }}
      backHref="/works"
      backLabel="Voltar às obras"
    >
      Content
    </AppLayout>,
  );
  expect(html).toContain('aria-label="Voltar às obras"');
  expect(html).toContain('href="/works"');
});

test("Signals new assignments in the menu without counting deliveries awaiting the owner", () => {
  useParticipations.mockReturnValueOnce({
    data: [
      { status: "writing" },
      { status: "waiting" },
      { status: "approved" },
    ],
  });
  const html = renderToStaticMarkup(
    <AppLayout user={{ id: "user", name: "Alice" }}>Content</AppLayout>,
  );
  expect(html).toContain('aria-label="1 pedido aguardando sua ação"');
});

test("Writing focus collapses the desktop menu and keeps navigation available", () => {
  const html = renderToStaticMarkup(
    <AppLayout user={{ id: "user", name: "Alice" }} writingFocus>
      Writing content
    </AppLayout>,
  );
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Mostrar menu");
  expect(html).toContain("Writing content");
});

test.each([false, true])(
  "Trash is the last navigation item for admin=%s and marks the active page",
  (isAdmin) => {
    const html = renderToStaticMarkup(
      <AppLayout
        user={{ id: "user", name: "Alice", is_admin: isAdmin }}
        activePage="trash"
      >
        Content
      </AppLayout>,
    );
    const nav = html.match(/<nav[\s\S]*?<\/nav>/)[0];
    expect(nav).toMatch(
      /<a(?=[^>]*href="\/trash")(?=[^>]*aria-current="page")[^>]*>/,
    );
    expect(nav).toMatch(/Lixeira<\/a><\/nav>$/);
    expect(nav).not.toMatch(/href="\/works" aria-current="page"/);
  },
);
