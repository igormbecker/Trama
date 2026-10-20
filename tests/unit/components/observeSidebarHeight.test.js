import observeSidebarHeight from "components/app/observeSidebarHeight";

test("Uses the actual sidebar position and available viewport height", () => {
  const handlers = {};
  const style = { setProperty: jest.fn(), removeProperty: jest.fn() };
  let top = 94;
  const sidebar = { style, getBoundingClientRect: () => ({ top }) };
  const disconnect = jest.fn();
  const viewport = {
    innerHeight: 900,
    addEventListener: jest.fn((name, handler) => {
      handlers[name] = handler;
    }),
    removeEventListener: jest.fn(),
    ResizeObserver: jest.fn(() => ({ observe: jest.fn(), disconnect })),
    document: { body: {} },
  };
  const cleanup = observeSidebarHeight(sidebar, viewport);
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--sidebar-available-height",
    "794px",
  );
  top = 12;
  handlers.scroll();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--sidebar-available-height",
    "876px",
  );
  viewport.innerHeight = 600;
  handlers.resize();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--sidebar-available-height",
    "576px",
  );
  cleanup();
  expect(disconnect).toHaveBeenCalled();
  expect(viewport.removeEventListener).toHaveBeenCalledWith(
    "scroll",
    handlers.scroll,
  );
  expect(style.removeProperty).toHaveBeenCalledWith(
    "--sidebar-available-height",
  );
});
