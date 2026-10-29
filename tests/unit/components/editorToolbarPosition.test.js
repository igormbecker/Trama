import {
  getToolbarPosition,
  observeToolbarPosition,
  revealToolbarSelection,
} from "components/works/editorToolbarPosition";

test("Moves a selected paragraph above the floating toolbar without changing the selection", () => {
  const range = {
    getBoundingClientRect: () => ({ top: 600, bottom: 660, height: 60 }),
  };
  const selection = {
    rangeCount: 1,
    anchorNode: {},
    focusNode: {},
    getRangeAt: () => range,
  };
  const view = {
    innerHeight: 700,
    document: { getSelection: () => selection },
    scrollBy: jest.fn(),
  };
  const surface = { contains: () => true };
  const toolbar = {
    dataset: { floating: "true" },
    getBoundingClientRect: () => ({ top: 620 }),
  };
  revealToolbarSelection(surface, toolbar, view);
  expect(view.scrollBy).toHaveBeenCalledWith({ top: 52, behavior: "instant" });
});

test("Does not move the page for a selection outside the editor", () => {
  const view = {
    document: { getSelection: () => ({ rangeCount: 1, anchorNode: {} }) },
    scrollBy: jest.fn(),
  };
  revealToolbarSelection(
    { contains: () => false },
    { dataset: { floating: "true" } },
    view,
  );
  expect(view.scrollBy).not.toHaveBeenCalled();
});

test("Repositions on keyboard, scroll and orientation changes and removes all observers on close", () => {
  const listeners = () => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  const viewport = { ...listeners(), offsetTop: 0, height: 844, scale: 1 };
  const mobile = { ...listeners(), matches: true };
  const disconnect = jest.fn();
  const view = {
    ...listeners(),
    innerHeight: 844,
    visualViewport: viewport,
    matchMedia: () => mobile,
    ResizeObserver: jest.fn(() => ({ observe: jest.fn(), disconnect })),
    document: { ...listeners(), getSelection: () => null },
    requestAnimationFrame: (callback) => {
      callback();
      return 1;
    },
    cancelAnimationFrame: jest.fn(),
  };
  const style = () => ({ setProperty: jest.fn(), removeProperty: jest.fn() });
  let rect = { top: 0, bottom: 1000, left: 16, width: 358 };
  const surface = { style: style(), getBoundingClientRect: () => rect };
  const toolbar = { style: style(), dataset: {}, offsetHeight: 64 };
  const slot = { style: {} };
  const cleanup = observeToolbarPosition(surface, toolbar, slot, view);
  expect(toolbar.dataset.floating).toBe("true");
  viewport.height = 350;
  viewport.offsetTop = 120;
  const resize = viewport.addEventListener.mock.calls.find(
    ([name]) => name === "resize",
  )[1];
  resize();
  expect(toolbar.style.setProperty).toHaveBeenCalledWith(
    "--toolbar-bottom",
    "374px",
  );
  mobile.matches = false;
  resize();
  expect(toolbar.dataset.floating).toBe("false");
  mobile.matches = true;
  rect = { ...rect, top: -1200, bottom: -10 };
  resize();
  expect(toolbar.dataset.floating).toBe("false");
  cleanup();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(viewport.removeEventListener).toHaveBeenCalledWith("resize", resize);
  const scroll = viewport.addEventListener.mock.calls.find(
    ([name]) => name === "scroll",
  )[1];
  expect(viewport.removeEventListener).toHaveBeenCalledWith("scroll", scroll);
  expect(view.removeEventListener).toHaveBeenCalledWith("scroll", scroll, true);
  expect(mobile.removeEventListener).toHaveBeenCalledWith("change", resize);
  expect(view.document.removeEventListener).toHaveBeenCalledWith(
    "selectionchange",
    resize,
  );
});

test("Keeps the mobile toolbar above a keyboard that shrinks and shifts the visual viewport", () => {
  expect(
    getToolbarPosition(
      { top: -100, bottom: 900, left: 16, width: 358 },
      {
        layoutHeight: 844,
        top: 120,
        height: 350,
        scale: 1,
      },
    ),
  ).toEqual({ visible: true, bottom: 374, left: 16, width: 358 });
});

test("Falls back to the window viewport when the keyboard API is unavailable", () => {
  expect(
    getToolbarPosition(
      { top: 100, bottom: 900, left: 16, width: 358 },
      {
        layoutHeight: 844,
        top: 0,
        height: 844,
        scale: 1,
      },
    ),
  ).toEqual({ visible: true, bottom: 0, left: 16, width: 358 });
});

test.each([
  { top: 900, bottom: 1200 },
  { top: -500, bottom: -10 },
])(
  "Does not float controls over other content when the editor is offscreen: %o",
  (rect) => {
    expect(
      getToolbarPosition(
        { ...rect, left: 16, width: 358 },
        {
          layoutHeight: 844,
          top: 0,
          height: 844,
          scale: 1,
        },
      ).visible,
    ).toBe(false);
  },
);

test("Leaves native pinch zoom usable instead of covering the magnified text", () => {
  expect(
    getToolbarPosition(
      { top: 0, bottom: 900, left: 16, width: 358 },
      {
        layoutHeight: 844,
        top: 120,
        height: 350,
        scale: 2,
      },
    ).visible,
  ).toBe(false);
});
