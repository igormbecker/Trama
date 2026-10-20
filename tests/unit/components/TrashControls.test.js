import { renderToStaticMarkup } from "react-dom/server";
import StructurePanel from "components/works/StructurePanel";
import TrashPage from "components/works/TrashPage";
jest.mock("next/router", () => ({ useRouter: () => ({}) }));
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);
const parts = [
  {
    id: "part",
    title: "Text",
    position: 1,
    chapters: [{ id: "section", title: "Conclusion", position: 1 }],
  },
];
test("Only owners see trash actions for parts and sections", () => {
  const props = { parts, workId: "work", projectType: "group_assignment" };
  const owner = renderToStaticMarkup(<StructurePanel {...props} canManage />);
  const reader = renderToStaticMarkup(
    <StructurePanel {...props} canManage={false} />,
  );
  expect(owner).toContain("Excluir parte");
  expect(owner).toContain("Excluir seção");
  expect(reader).not.toContain("Excluir parte");
  expect(reader).not.toContain("Excluir seção");
});
test("Trash explains restoration and lists preserved items with their parent context", () => {
  const html = renderToStaticMarkup(
    <TrashPage
      user={{ id: "owner" }}
      items={[
        {
          id: "section",
          kind: "chapter",
          title: "Conclusion",
          work_id: "work",
          work_title: "Research",
          project_type: "group_assignment",
          parent_title: "Text",
        },
      ]}
    />,
  );
  expect(html).toContain("Restaurar");
  expect(html).toContain("Excluir para sempre");
  expect(html).toContain("Conclusion");
  expect(html).toContain("Research");
  expect(html).toContain("Text");
});
