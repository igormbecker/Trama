import { renderToStaticMarkup } from "react-dom/server";
import WorkCreditsPanel from "components/works/WorkCreditsPanel";
test("Keeps suggestions separate from confirmed credits and permits authors without accounts", () => {
  const html = renderToStaticMarkup(
    <WorkCreditsPanel
      workId="work"
      initialData={{
        credits: {
          authors: ["Autora sem conta"],
          contributors: [],
          reviewers: [],
        },
        suggestions: {
          authors: [],
          contributors: [],
          reviewers: ["Ana — Capítulo"],
        },
      }}
    />,
  );
  expect(html).toContain("Autora sem conta");
  expect(html).toContain("Adicionar: Ana — Capítulo");
  expect(html).toMatch(/id="credits-reviewers"[^>]*><\/textarea>/);
  expect(html).toContain("Salvar créditos");
});
