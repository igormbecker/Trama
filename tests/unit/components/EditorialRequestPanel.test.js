import { renderToStaticMarkup } from "react-dom/server";
import EditorialRequestPanel from "components/works/EditorialRequestPanel";

const props = {
  user: { id: "owner" },
  work: { id: "work", owner_id: "owner" },
  content: { chapter: { id: "chapter" } },
  participants: [{ user_id: "organizer", name: "Alice" }],
};

test("Explains the participant requirement and links to invitations when no organizer is active", () => {
  const html = renderToStaticMarkup(
    <EditorialRequestPanel {...props} participants={[]} />,
  );
  expect(html).toContain("Esta obra ainda não tem organizadores ativos.");
  expect(html).toContain("Após o aceite do convite");
  expect(html).toContain('href="/works/work#participants-title"');
  expect(html).not.toContain("Novo pedido por capítulo");
});

test("Shows a collapsed request before the chapter and a collapsed history after it", () => {
  const html = renderToStaticMarkup(
    <EditorialRequestPanel
      {...props}
      initialRequestContent={{
        history: [
          {
            id: "old",
            kind: "review",
            status: "canceled",
            created_at: "2026-10-19",
          },
        ],
      }}
    >
      <article>Chapter text</article>
    </EditorialRequestPanel>,
  );
  expect(html).toContain("Solicitar contribuição ou revisão");
  expect(html.indexOf("Solicitar contribuição ou revisão")).toBeLessThan(
    html.indexOf("Chapter text"),
  );
  expect(html.indexOf("Pedidos anteriores")).toBeGreaterThan(
    html.indexOf("Chapter text"),
  );
  expect(html).not.toMatch(/<details[^>]*open/);
});

test("Summarizes the active request and its assigned participant", () => {
  const html = renderToStaticMarkup(
    <EditorialRequestPanel
      {...props}
      initialRequestContent={{
        request: {
          id: "request",
          kind: "review",
          status: "writing",
          assignee_user_id: "organizer",
        },
      }}
    />,
  );
  expect(html).toContain("Revisão · Alice · Em revisão");
});
