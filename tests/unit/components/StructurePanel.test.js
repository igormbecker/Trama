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

test.each([
  ["review", "writing", null, "Em revisão"],
  ["contribution", "writing", null, "Em contribuição"],
  ["contribution", "waiting", null, "Aguardando aprovação"],
  ["review", "approved", "changes_requested", "Correções solicitadas"],
  ["review", "approved", "approved", "Aprovado pelo revisor"],
])("Shows editorial progress for %s / %s", (kind, status, verdict, label) => {
  const annotated = [
    {
      ...parts[0],
      chapters: [
        {
          ...parts[0].chapters[0],
          editorial_request: {
            kind,
            status,
            review_verdict: verdict,
            assignee_name: "Alice",
          },
        },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    <StructurePanel workId="work" parts={annotated} canManage={false} />,
  );
  expect(html).toContain(label);
  expect(html).toContain("Alice");
});

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

test("Owners have named mobile options beside each part and chapter title", () => {
  const html = renderToStaticMarkup(
    <StructurePanel workId="work" parts={parts} canManage />,
  );
  expect(html).toContain('aria-label="Opções da parte: Part one"');
  expect(html).toContain('aria-label="Opções do capítulo: Chapter one"');
  expect(html).toContain('aria-haspopup="dialog"');
  expect(html).toContain("Mover para cima");
  expect(html).toContain("Mover para baixo");
});

test("Group assignments label their mobile options as sections", () => {
  const html = renderToStaticMarkup(
    <StructurePanel
      workId="work"
      parts={parts}
      canManage
      projectType="group_assignment"
    />,
  );
  expect(html).toContain('aria-label="Opções da seção: Chapter one"');
  expect(html).toContain("Escrever seção");
});
