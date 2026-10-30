import observeStructureActions from "components/works/observeStructureActions";

test("Collapses only overflowing rows and restores them when space returns", () => {
  let update;
  const disconnect = jest.fn();
  const row = { clientWidth: 500, scrollWidth: 540 };
  const entry = { dataset: {} };
  const viewport = {
    ResizeObserver: jest.fn((callback) => {
      update = callback;
      return { observe: jest.fn(), disconnect };
    }),
  };
  const cleanup = observeStructureActions(entry, row, viewport);
  expect(entry.dataset.compactActions).toBe("true");
  row.clientWidth = 600;
  update();
  expect(entry.dataset.compactActions).toBe("false");
  row.clientWidth = 540;
  update();
  expect(entry.dataset.compactActions).toBe("false");
  cleanup();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(entry.dataset.compactActions).toBeUndefined();
});
