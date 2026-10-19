import { renderToStaticMarkup } from "react-dom/server";
import ParticipationsPage from "components/works/ParticipationsPage";
jest.mock(
  "components/app/AppLayout",
  () =>
    function Layout({ children }) {
      return <main>{children}</main>;
    },
);

test("Separates ongoing and completed assignments with links to their exact requests", () => {
  const base = {
    work_id: "work",
    work_title: "Obra",
    chapter_id: "chapter",
    chapter_title: "Capítulo",
    kind: "review",
  };
  const html = renderToStaticMarkup(
    <ParticipationsPage
      user={{ id: "user" }}
      participations={[
        { ...base, id: "active", status: "writing" },
        {
          ...base,
          id: "done",
          status: "approved",
          review_verdict: "changes_requested",
        },
        { ...base, id: "canceled", status: "canceled" },
      ]}
    />,
  );
  expect(html).toContain("Em andamento (1)");
  expect(html).toContain("Concluídas (2)");
  expect(html).toContain("Correções solicitadas");
  expect(html).toContain("Pedido cancelado");
  expect(html).toContain("requestId=done");
  expect(html).not.toContain("Em atraso");
});
test("Explains when there are no assigned requests", () => {
  const html = renderToStaticMarkup(
    <ParticipationsPage user={{ id: "user" }} participations={[]} />,
  );
  expect(html).toContain("Você não tem pedidos em andamento.");
  expect(html).toContain("Nenhuma participação concluída.");
});
