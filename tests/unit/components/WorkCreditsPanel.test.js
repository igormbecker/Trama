import { renderToStaticMarkup } from "react-dom/server";
import WorkCreditsPanel from "components/works/WorkCreditsPanel";
test("Keeps suggestions separate from confirmed credits and permits authors without accounts", () => {
  const html = renderToStaticMarkup(
    <WorkCreditsPanel
      workId="work"
      initialData={{
        has_saved_credits: true,
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

test("Prefills historical participation before the first save without inferring authorship", () => {
  const html = renderToStaticMarkup(
    <WorkCreditsPanel
      workId="work"
      initialData={{
        has_saved_credits: false,
        credits: { authors: [], contributors: [], reviewers: [] },
        suggestions: {
          authors: [],
          contributors: ["Rafael — Capítulo 1"],
          reviewers: ["Ana — Capítulo 2"],
        },
      }}
    />,
  );
  expect(html).toMatch(
    /id="credits-contributors"[^>]*>Rafael — Capítulo 1<\/textarea>/,
  );
  expect(html).toMatch(
    /id="credits-reviewers"[^>]*>Ana — Capítulo 2<\/textarea>/,
  );
  expect(html).toMatch(/id="credits-authors"[^>]*><\/textarea>/);
});
