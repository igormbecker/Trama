import { renderToStaticMarkup } from "react-dom/server";
import StructurePanel from "components/works/StructurePanel";

jest.mock("next/router", () => ({ useRouter: () => ({}) }));

const parts = [
  {
    id: "part",
    title: "Part one",
    position: 1,
    chapters: [
      {
        id: "chapter",
        title: "Chapter one",
        position: 1,
        description: "Summary",
      },
    ],
  },
];

test("Separates chapter writing from description editing for the owner", () => {
  const html = renderToStaticMarkup(
    <StructurePanel workId="work" parts={parts} canManage />,
  );
  expect(html).toContain("Escrever capítulo");
  expect(html).toContain("/works/work/chapters/chapter?write=1");
  expect(html).toContain("Editar descrição");
  expect(html).not.toContain("Editar capítulo");
  expect(html).toContain("<svg");
});

test("Readers keep the chapter reading link without management actions", () => {
  const html = renderToStaticMarkup(
    <StructurePanel workId="work" parts={parts} canManage={false} />,
  );
  expect(html).toContain('href="/works/work/chapters/chapter"');
  expect(html).not.toContain("Escrever capítulo");
  expect(html).not.toContain("Editar descrição");
});
