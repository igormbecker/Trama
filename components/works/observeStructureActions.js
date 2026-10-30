export default function observeStructureActions(entry, row, viewport = window) {
  function update() {
    entry.dataset.compactActions = String(row.scrollWidth > row.clientWidth);
  }
  update();
  const observer = new viewport.ResizeObserver(update);
  observer.observe(row);
  return () => {
    observer.disconnect();
    delete entry.dataset.compactActions;
  };
}
