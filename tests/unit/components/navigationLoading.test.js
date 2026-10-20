import { trackNavigation } from "components/shared/navigationProgress";

function setup() {
  const handlers = {};
  const events = {
    on: jest.fn((name, handler) => {
      handlers[name] = handler;
    }),
    off: jest.fn(),
  };
  const document = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const onChange = jest.fn();
  const cleanup = trackNavigation({
    events,
    document,
    onChange,
    currentUrl: () => "https://trama.test/home",
  });
  const click = (href, overrides = {}) => {
    const anchor = { href, target: "", hasAttribute: () => false };
    const event = {
      button: 0,
      target: { closest: () => anchor },
      preventDefault: jest.fn(),
      stopImmediatePropagation: jest.fn(),
      ...overrides,
    };
    document.addEventListener.mock.calls[0][1](event);
    return event;
  };
  return { handlers, events, document, onChange, cleanup, click };
}

test("Shows navigation immediately and stops on completion or failure", () => {
  const { handlers, onChange } = setup();
  handlers.routeChangeStart("/works");
  expect(onChange).toHaveBeenLastCalledWith(true);
  handlers.routeChangeComplete("/works");
  expect(onChange).toHaveBeenLastCalledWith(false);
  handlers.routeChangeStart("/account");
  handlers.routeChangeError(new Error("Offline"), "/account");
  expect(onChange).toHaveBeenLastCalledWith(false);
});

test("An earlier canceled transition cannot hide the newer transition", () => {
  const { handlers, onChange } = setup();
  handlers.routeChangeStart("/works");
  handlers.routeChangeStart("/account");
  handlers.routeChangeError({ cancelled: true }, "/works");
  expect(onChange).toHaveBeenLastCalledWith(true);
  handlers.routeChangeComplete("/account");
  expect(onChange).toHaveBeenLastCalledWith(false);
});

test("Blocks repeated internal navigation only while pending, preserving anchors and new tabs", () => {
  const { handlers, click } = setup();
  expect(click("/works").preventDefault).not.toHaveBeenCalled();
  handlers.routeChangeStart("/works");
  expect(click("/works").preventDefault).toHaveBeenCalled();
  expect(click("/account").stopImmediatePropagation).toHaveBeenCalled();
  expect(
    click("/works", { ctrlKey: true }).preventDefault,
  ).not.toHaveBeenCalled();
  expect(
    click("/works", { metaKey: true }).preventDefault,
  ).not.toHaveBeenCalled();
  expect(click("#contents").preventDefault).not.toHaveBeenCalled();
  expect(click("https://example.com").preventDefault).not.toHaveBeenCalled();
  expect(click("/works", { button: 1 }).preventDefault).not.toHaveBeenCalled();
  expect(
    click("/works", { shiftKey: true }).preventDefault,
  ).not.toHaveBeenCalled();
  expect(
    click("/works", {
      target: {
        closest: () => ({
          href: "/works",
          target: "_blank",
          hasAttribute: () => false,
        }),
      },
    }).preventDefault,
  ).not.toHaveBeenCalled();
  expect(
    click("/download", {
      target: {
        closest: () => ({
          href: "/download",
          target: "",
          hasAttribute: () => true,
        }),
      },
    }).preventDefault,
  ).not.toHaveBeenCalled();
  handlers.routeChangeError({}, "/works");
  expect(click("/works").preventDefault).not.toHaveBeenCalled();
});

test("Ignores shallow updates and removes subscriptions on unmount", () => {
  const { handlers, onChange, events, document, cleanup } = setup();
  handlers.routeChangeStart("/home?tab=one", { shallow: true });
  expect(onChange).not.toHaveBeenCalled();
  cleanup();
  expect(events.off).toHaveBeenCalledTimes(3);
  expect(document.removeEventListener).toHaveBeenCalledWith(
    "click",
    expect.any(Function),
    true,
  );
});
