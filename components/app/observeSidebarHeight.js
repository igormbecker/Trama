export default function observeSidebarHeight(sidebar, viewport = window) {
  let previousHeight;
  function updateHeight() {
    const top = Math.max(0, sidebar.getBoundingClientRect().top);
    const height = Math.max(0, viewport.innerHeight - top - 12);
    if (height === previousHeight) return;
    previousHeight = height;
    sidebar.style.setProperty("--sidebar-available-height", `${height}px`);
  }
  updateHeight();
  const observer = new viewport.ResizeObserver(updateHeight);
  observer.observe(sidebar);
  observer.observe(viewport.document.body);
  viewport.addEventListener("resize", updateHeight);
  viewport.addEventListener("scroll", updateHeight, { passive: true });
  return () => {
    observer.disconnect();
    viewport.removeEventListener("resize", updateHeight);
    viewport.removeEventListener("scroll", updateHeight);
    sidebar.style.removeProperty("--sidebar-available-height");
  };
}
