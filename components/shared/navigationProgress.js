export function trackNavigation({ events, document, currentUrl, onChange }) {
  let activeUrl = null;
  function start(url, { shallow } = {}) {
    if (shallow) {
      return;
    }
    activeUrl = url;
    onChange(true);
  }
  function finish(url) {
    if (url !== activeUrl) {
      return;
    }
    activeUrl = null;
    onChange(false);
  }
  function fail(error, url) {
    finish(url);
  }
  function preventRepeatedNavigation(event) {
    if (
      !activeUrl ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const anchor = event.target?.closest?.("a[href]");
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self")
    ) {
      return;
    }
    const current = new URL(currentUrl());
    const destination = new URL(anchor.href, current);
    if (
      destination.origin !== current.origin ||
      (destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash)
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  events.on("routeChangeStart", start);
  events.on("routeChangeComplete", finish);
  events.on("routeChangeError", fail);
  document.addEventListener("click", preventRepeatedNavigation, true);
  return () => {
    events.off("routeChangeStart", start);
    events.off("routeChangeComplete", finish);
    events.off("routeChangeError", fail);
    document.removeEventListener("click", preventRepeatedNavigation, true);
  };
}
