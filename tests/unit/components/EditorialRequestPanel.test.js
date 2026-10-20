import { renderToStaticMarkup } from "react-dom/server";
import EditorialRequestPanel from "components/works/EditorialRequestPanel";
import { chapterRequest } from "components/works/chapterClient";

let mockReviewAction;
beforeEach(() => jest.clearAllMocks());
jest.mock("components/works/chapterClient", () => ({
  chapterRequest: jest.fn(),
}));
jest.mock(
  "components/works/ChapterReview",
  () =>
    function Review({ onAction }) {
      mockReviewAction = onAction;
      return null;
    },
);

const props = {
  user: { id: "owner" },
  work: { id: "work", owner_id: "owner" },
  content: { chapter: { id: "chapter" } },
  participants: [{ user_id: "organizer", name: "Alice" }],
};

test("Saving a new comment reports success without requesting an undefined history entry", async () => {
  const initialRequestContent = {
    request: {
      id: "request",
      kind: "review",
      status: "writing",
      assignee_user_id: "organizer",
      review_document: { type: "doc", content: [] },
    },
  };
  chapterRequest.mockImplementation(async (path) => {
    if (path.includes("requestId=undefined"))
      throw new Error("Pedido inexistente.");
    return initialRequestContent;
  });
  renderToStaticMarkup(
    <EditorialRequestPanel
      {...props}
      user={{ id: "organizer" }}
      initialRequestContent={initialRequestContent}
    />,
  );
  const input = {
    action: "comment",
    start: 0,
    end: 4,
    quote: "Cena",
    message: "Confira a cena.",
  };
  await expect(mockReviewAction(input)).resolves.toBe(true);
  expect(chapterRequest.mock.calls.map(([path]) => path)).toEqual([
    "/api/v1/works/work/chapters/chapter/request",
    "/api/v1/works/work/chapters/chapter/request",
  ]);
});

test("Two immediate comment submissions send only one mutation", async () => {
  let finishSave;
  const initialRequestContent = {
    request: {
      id: "request",
      kind: "review",
      status: "writing",
      assignee_user_id: "organizer",
      review_document: { type: "doc", content: [] },
    },
  };
  chapterRequest.mockImplementation((path, method) =>
    method === "PATCH"
      ? new Promise((resolve) => {
          finishSave = resolve;
        })
      : Promise.resolve(initialRequestContent),
  );
  renderToStaticMarkup(
    <EditorialRequestPanel
      {...props}
      user={{ id: "organizer" }}
      initialRequestContent={initialRequestContent}
    />,
  );
  const input = {
    action: "comment",
    start: 0,
    end: 4,
    quote: "Cena",
    message: "Confira.",
  };
  const first = mockReviewAction(input);
  await expect(mockReviewAction(input)).resolves.toBe(false);
  expect(
    chapterRequest.mock.calls.filter(([, method]) => method === "PATCH"),
  ).toHaveLength(1);
  finishSave({});
  await expect(first).resolves.toBe(true);
});

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
