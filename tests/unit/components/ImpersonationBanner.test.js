import { renderToStaticMarkup } from "react-dom/server";
import useSWR from "swr";
import ImpersonationBanner from "components/auth/ImpersonationBanner";
import { useEffect, useRef } from "react";
jest.mock("swr", () => jest.fn());
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: jest.fn(),
  useRef: jest.fn(() => ({ current: null })),
}));

test("Reserves the banner height, updates it on resize and clears it on removal", () => {
  const banner = { getBoundingClientRect: jest.fn(() => ({ height: 172 })) };
  const style = { setProperty: jest.fn(), removeProperty: jest.fn() };
  let onResize;
  const disconnect = jest.fn();
  global.document = { documentElement: { style } };
  global.ResizeObserver = jest.fn((callback) => {
    onResize = callback;
    return { observe: jest.fn(), disconnect };
  });
  useRef.mockReturnValue({ current: banner });
  useSWR.mockReturnValue({
    data: { active: true, name: "Maria", expired: true },
  });
  useEffect.mockClear();
  renderToStaticMarkup(<ImpersonationBanner />);
  const cleanup = useEffect.mock.calls[0][0]();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--impersonation-banner-height",
    "172px",
  );
  banner.getBoundingClientRect.mockReturnValue({ height: 220 });
  onResize();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--impersonation-banner-height",
    "220px",
  );
  cleanup();
  expect(disconnect).toHaveBeenCalled();
  expect(style.removeProperty).toHaveBeenCalledWith(
    "--impersonation-banner-height",
  );
  useRef.mockImplementation(() => ({ current: null }));
  delete global.document;
  delete global.ResizeObserver;
});

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
