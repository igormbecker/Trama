import { renderToStaticMarkup } from "react-dom/server";
import WorksPage from "components/works/WorksPage";
import StructurePanel from "components/works/StructurePanel";
import WorkReadingPage from "components/works/WorkReadingPage";
import { filterProjects } from "components/works/projectLabels";
jest.mock("next/router", () => ({ useRouter: () => ({}) }));
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);
jest.mock("components/home/useRecordAccess", () => jest.fn());

test("Lists both project types and offers creation and filtering without school fields", () => {
  const html = renderToStaticMarkup(
    <WorksPage
      user={{ id: "owner", name: "Reader" }}
      works={[
        { id: "one", title: "Book", type: "literary" },
        { id: "two", title: "Research", type: "group_assignment" },
      ]}
    />,
  );
  expect(html).toContain("Meus projetos");
  expect(html).toContain("Obra literária");
  expect(html).toContain("Trabalho em grupo");
  expect(html).toContain("Filtrar projetos");
  expect(html).not.toContain("ABNT");
});

test("Filters each type and keeps legacy works in the literary list", () => {
  const works = [
    { id: "legacy" },
    { id: "book", type: "literary" },
    { id: "group", type: "group_assignment" },
  ];
  expect(filterProjects(works, "all")).toEqual(works);
  expect(filterProjects(works, "literary").map((work) => work.id)).toEqual([
    "legacy",
    "book",
  ]);
  expect(
    filterProjects(works, "group_assignment").map((work) => work.id),
  ).toEqual(["group"]);
});

test("Group assignments use sections while preserving chapter routes", () => {
  const html = renderToStaticMarkup(
    <StructurePanel
      workId="work"
      projectType="group_assignment"
      canManage
      parts={[
        {
          id: "part",
          title: "Research",
          position: 1,
          chapters: [{ id: "section", title: "Introdução", position: 1 }],
        },
      ]}
    />,
  );
  expect(html).toContain("Partes e seções");
  expect(html).toContain("Adicionar seção");
  expect(html).toContain("Escrever seção");
  expect(html).toContain("/works/work/chapters/section");
  expect(html).not.toContain("Escrever capítulo");
});

test("Reading an empty group assignment refers to sections", () => {
  const html = renderToStaticMarkup(
    <WorkReadingPage
      user={{ id: "reader" }}
      work={{ id: "work", title: "Research", type: "group_assignment" }}
      parts={[]}
    />,
  );
  expect(html).toContain("seções");
  expect(html).not.toContain("capítulos");
});
