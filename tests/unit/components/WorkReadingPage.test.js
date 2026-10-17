import { renderToStaticMarkup } from "react-dom/server";
import WorkReadingPage from "components/works/WorkReadingPage";
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);
jest.mock("components/home/useRecordAccess", () => jest.fn());
const user = { id: "reader" };
const work = { id: "work", title: "Book" };
test("Renders the saved chapter text and a linked table of contents", () => {
  const html = renderToStaticMarkup(
    <WorkReadingPage
      user={user}
      work={work}
      parts={[
        {
          id: "part",
          position: 1,
          title: "Part",
          chapters: [
            {
              id: "chapter",
              position: 2,
              title: "Chapter",
              document: {
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Saved text",
                        marks: [{ type: "bold" }],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ]}
    />,
  );
  expect(html).toContain("<strong>Saved text</strong>");
  expect(html).toContain('href="#chapter-chapter"');
  expect(html).toContain('id="chapter-chapter"');
  expect(html).not.toContain("Escrever capítulo");
});
test("Explains when there are no saved chapters", () => {
  const html = renderToStaticMarkup(
    <WorkReadingPage user={user} work={work} parts={[]} />,
  );
  expect(html).toContain("Esta obra ainda não tem texto salvo");
  expect(html).not.toContain("Sumário");
});
