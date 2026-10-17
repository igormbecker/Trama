import { renderToStaticMarkup } from "react-dom/server";
import WorkDetails from "components/works/WorkDetails";
jest.mock("next/router", () => ({ useRouter: () => ({}) }));
test.each([true, false])(
  "Only the owner sees the work editing action (%s)",
  (canManage) => {
    const html = renderToStaticMarkup(
      <WorkDetails
        work={{ id: "work", title: "Book", description: "Summary" }}
        canManage={canManage}
      />,
    );
    expect(html.includes("Editar obra")).toBe(canManage);
    expect(html).toContain("Summary");
  },
);
