import { renderToStaticMarkup } from "react-dom/server";
import ChapterReview from "components/works/ChapterReview";
import ChapterReader from "components/works/ChapterReader";
import { reviewText } from "models/reviewDocument";

const document = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Uma " },
        { type: "text", text: "cena clara", marks: [{ type: "bold" }] },
      ],
    },
  ],
};
const comment = {
  id: "comment",
  start: 4,
  end: 8,
  quote: "cena",
  message: "Explique o cenário.",
};
test("Highlights only the anchored range, preserving formatting and readable text", () => {
  const html = renderToStaticMarkup(
    <ChapterReader document={document} annotations={[comment]} />,
  );
  expect(reviewText(document)).toBe("Uma cena clara");
  expect(html).toContain('data-review-comment="comment"');
  expect(html).toContain("<strong>cena</strong>");
  expect(html).toContain("<strong> clara</strong>");
});
test("Review uses read-only text, saved comments and verdict controls instead of a rich-text editor", () => {
  const html = renderToStaticMarkup(
    <ChapterReview
      request={{
        id: "review",
        review_document: document,
        review_comments: [comment],
        base_chapter_revision: 3,
      }}
      editable
      onAction={() => {}}
    />,
  );
  expect(html).toContain("Explique o cenário.");
  expect(html).toContain("Concluir: aprovado");
  expect(html).toContain("Concluir: correções solicitadas");
  expect(html).not.toContain("contenteditable");
});
test("Completed review displays its verdict without mutation controls", () => {
  const html = renderToStaticMarkup(
    <ChapterReview
      request={{
        id: "review",
        review_document: document,
        review_verdict: "changes_requested",
      }}
      editable={false}
    />,
  );
  expect(html).toContain("Correções solicitadas");
  expect(html).not.toContain("Concluir:");
});

test("Keeps action feedback at the end of the review after completion", () => {
  const html = renderToStaticMarkup(
    <ChapterReview
      request={{
        id: "review",
        review_document: document,
        review_verdict: "approved",
      }}
      editable={false}
      success="Parecer enviado ao responsável."
    />,
  );
  expect(html).toContain("Parecer enviado ao responsável.");
  expect(html.indexOf("Parecer enviado ao responsável.")).toBeGreaterThan(
    html.indexOf("Comentários ("),
  );
  expect(html).toContain('role="status"');
});

test("Shows comment save confirmation in the panel header before filters and comments", () => {
  const html = renderToStaticMarkup(
    <ChapterReview
      request={{
        id: "review",
        review_document: document,
        review_comments: [comment],
      }}
      editable
      success="Comentário salvo com sucesso."
    />,
  );
  expect(html.indexOf("Comentário salvo com sucesso.")).toBeLessThan(
    html.indexOf(">Exibir</label>"),
  );
  expect(html.indexOf("Comentário salvo com sucesso.")).toBeLessThan(
    html.indexOf("Explique o cenário."),
  );
  expect(html).toContain('role="status"');
});
