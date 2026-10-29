export function getToolbarPosition(rect, viewport) {
  const bottomEdge = viewport.top + viewport.height;
  return {
    visible:
      viewport.scale === 1 &&
      rect.top < bottomEdge - 80 &&
      rect.bottom > viewport.top + 80,
    bottom: Math.max(0, viewport.layoutHeight - bottomEdge),
    left: rect.left,
    width: rect.width,
  };
}

export function revealToolbarSelection(surface, toolbar, view) {
  if (toolbar.dataset.floating !== "true") return;
  const selection = view.document.getSelection();
  if (
    !selection?.rangeCount ||
    !surface.contains(selection.anchorNode) ||
    !surface.contains(selection.focusNode)
  )
    return;
  const top = (view.visualViewport?.offsetTop || 0) + 12;
  const bottom = toolbar.getBoundingClientRect().top - 12;
  let range = selection.getRangeAt(0);
  let rect = range.getBoundingClientRect();
  if (rect.height > bottom - top) {
    range = range.cloneRange();
    range.setStart(selection.focusNode, selection.focusOffset);
    range.collapse(true);
    rect = range.getBoundingClientRect();
  }
  if (!rect.height) return;
  const distance =
    rect.bottom > bottom
      ? rect.bottom - bottom
      : rect.top < top
        ? rect.top - top
        : 0;
  if (distance) view.scrollBy({ top: distance, behavior: "instant" });
}

export function observeToolbarPosition(surface, toolbar, slot, view) {
  const viewport = view.visualViewport;
  const mobile = view.matchMedia("(max-width: 600px)");
  let frame;
  let revealSelection = false;
  function update() {
    const position = getToolbarPosition(surface.getBoundingClientRect(), {
      layoutHeight: view.innerHeight,
      top: viewport?.offsetTop || 0,
      height: viewport?.height || view.innerHeight,
      scale: viewport?.scale || 1,
    });
    toolbar.dataset.floating = String(mobile.matches && position.visible);
    toolbar.style.setProperty("--toolbar-bottom", `${position.bottom}px`);
    toolbar.style.setProperty("--toolbar-left", `${position.left}px`);
    toolbar.style.setProperty("--toolbar-width", `${position.width}px`);
    surface.style.setProperty("--toolbar-height", `${toolbar.offsetHeight}px`);
    slot.style.minHeight = `${toolbar.offsetHeight}px`;
    if (revealSelection) {
      revealSelection = false;
      revealToolbarSelection(surface, toolbar, view);
    }
  }
  function schedule() {
    view.cancelAnimationFrame(frame);
    frame = view.requestAnimationFrame(update);
  }
  function scheduleReveal() {
    revealSelection = true;
    schedule();
  }
  update();
  const observer = new view.ResizeObserver(scheduleReveal);
  observer.observe(toolbar);
  observer.observe(surface);
  view.addEventListener("scroll", schedule, true);
  view.addEventListener("resize", scheduleReveal);
  viewport?.addEventListener("resize", scheduleReveal);
  viewport?.addEventListener("scroll", schedule);
  mobile.addEventListener("change", scheduleReveal);
  view.document.addEventListener("selectionchange", scheduleReveal);
  return () => {
    view.cancelAnimationFrame(frame);
    observer.disconnect();
    view.removeEventListener("scroll", schedule, true);
    view.removeEventListener("resize", scheduleReveal);
    viewport?.removeEventListener("resize", scheduleReveal);
    viewport?.removeEventListener("scroll", schedule);
    mobile.removeEventListener("change", scheduleReveal);
    view.document.removeEventListener("selectionchange", scheduleReveal);
    surface.style.removeProperty("--toolbar-height");
  };
}
