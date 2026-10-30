import observeVisualViewport from "components/app/observeVisualViewport";

function setup(withViewport = true) {
  const handlers = {};
  const style = { setProperty: jest.fn(), removeProperty: jest.fn() };
  const visualViewport = {
    offsetTop: 0,
    addEventListener: jest.fn((name, handler) => {
      handlers[name] = handler;
    }),
    removeEventListener: jest.fn(),
  };
  const viewport = {
    visualViewport: withViewport ? visualViewport : undefined,
  };
  return { handlers, style, visualViewport, viewport };
}

test("Follows the visible top when the keyboard pans the viewport and resets on close", () => {
  const { handlers, style, visualViewport, viewport } = setup();
  const cleanup = observeVisualViewport({ style }, viewport);
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--visual-viewport-top",
    "0px",
  );
  visualViewport.offsetTop = 180;
  handlers.scroll();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--visual-viewport-top",
    "180px",
  );
  visualViewport.offsetTop = 0;
  handlers.resize();
  expect(style.setProperty).toHaveBeenLastCalledWith(
    "--visual-viewport-top",
    "0px",
  );
  cleanup();
  expect(visualViewport.removeEventListener).toHaveBeenCalledWith(
    "scroll",
    handlers.scroll,
  );
  expect(visualViewport.removeEventListener).toHaveBeenCalledWith(
    "resize",
    handlers.resize,
  );
  expect(style.removeProperty).toHaveBeenCalledWith("--visual-viewport-top");
});

test("Preserves CSS fallback in browsers without VisualViewport", () => {
  const { style, viewport } = setup(false);
  expect(() => observeVisualViewport({ style }, viewport)()).not.toThrow();
  expect(style.setProperty).not.toHaveBeenCalled();
});
