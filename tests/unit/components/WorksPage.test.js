import { renderToStaticMarkup } from "react-dom/server";
import WorksPage from "components/works/WorksPage";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {} }) }));
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <>{children}</>;
    },
);

const props = {
  user: { name: "Alice" },
  works: [{ id: "work", title: "Minha obra", type: "literary" }],
};

test("Shows the project list with creation collapsed and an accessible creation trigger", () => {
  const html = renderToStaticMarkup(<WorksPage {...props} />);
  expect(html).toContain('aria-controls="create-project-panel"');
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Criar projeto");
  expect(html).toMatch(/<section[^>]*id="create-project-panel"[^>]*hidden=""/);
  expect(html).toContain('href="/works/work"');
  expect(html).toContain("Minha obra");
});

test("Keeps the creation label and puts cancellation inside the form", () => {
  const html = renderToStaticMarkup(<WorksPage {...props} />);
  expect(html).not.toContain("Fechar criação");
  expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*>/);
  expect(html).toMatch(
    /<form[\s\S]*<button[^>]*type="button"[^>]*>Cancelar<\/button>[\s\S]*<\/form>/,
  );
});
