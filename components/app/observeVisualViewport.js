export default function observeVisualViewport(element, viewport = window) {
  const visualViewport = viewport.visualViewport;
  if (!visualViewport) {
    return () => {};
  }
  let previousTop;
  function update() {
    const top = Math.max(0, visualViewport.offsetTop);
    if (top === previousTop) {
      return;
    }
    previousTop = top;
    element.style.setProperty("--visual-viewport-top", `${top}px`);
  }
  update();
  visualViewport.addEventListener("scroll", update, { passive: true });
  visualViewport.addEventListener("resize", update);
  return () => {
    visualViewport.removeEventListener("scroll", update);
    visualViewport.removeEventListener("resize", update);
    element.style.removeProperty("--visual-viewport-top");
  };
}
