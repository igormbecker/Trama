import { renderToStaticMarkup } from "react-dom/server";
import useSWR from "swr";
import ImpersonationBanner from "components/auth/ImpersonationBanner";
jest.mock("swr", () => jest.fn());

test("Shows the represented account, real-data warning and return action", () => {
  useSWR.mockReturnValue({
    data: {
      active: true,
      name: "Maria",
      expires_at: new Date(Date.now() + 60000).toISOString(),
    },
  });
  const html = renderToStaticMarkup(<ImpersonationBanner />);
  expect(html).toContain("Maria");
  expect(html).toContain("dados reais");
  expect(html).toContain("Encerrar personificação");
});
test("Keeps the return action available after impersonation expires", () => {
  useSWR.mockReturnValue({
    data: { active: true, name: "Maria", expired: true },
  });
  const html = renderToStaticMarkup(<ImpersonationBanner />);
  expect(html).toContain("Personificação expirada");
  expect(html).toContain("Encerrar personificação");
});
test("Does not show impersonation controls in an ordinary session", () => {
  useSWR.mockReturnValue({ data: { active: false } });
  expect(renderToStaticMarkup(<ImpersonationBanner />)).toBe("");
});
