import EditorToolbar from "components/works/EditorToolbar";

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: () => [false, jest.fn()],
  useId: () => "toolbar-more",
}));

function find(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}

test.each(["mouse", "touch", "pen"])(
  "Preserves selection on %s before applying bold without scrolling away",
  (pointerType) => {
    const chain = { focus: jest.fn(), toggleBold: jest.fn(), run: jest.fn() };
    chain.focus.mockReturnValue(chain);
    chain.toggleBold.mockReturnValue(chain);
    const editor = { chain: () => chain, isActive: () => false };
    const tree = EditorToolbar({
      editor,
      disabled: false,
    });
    const button = find(
      tree,
      (node) => node.props?.["aria-label"] === "Negrito",
    );
    const preventDefault = jest.fn();
    button.props.onPointerDown({ pointerType, preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    button.props.onClick();
    expect(chain.focus).toHaveBeenCalledWith(undefined, {
      scrollIntoView: false,
    });
    expect(chain.toggleBold).toHaveBeenCalledTimes(1);
    expect(chain.run).toHaveBeenCalledTimes(1);
  },
);

test("Keeps formatting disabled while editing is blocked", () => {
  const tree = EditorToolbar({
    editor: null,
    disabled: true,
  });
  expect(
    find(tree, (node) => node.props?.["aria-label"] === "Negrito").props
      .disabled,
  ).toBe(true);
});

test("Mobile formatting starts collapsed and its toggle preserves the text selection", () => {
  const tree = EditorToolbar({ editor: null, disabled: false });
  const toggle = find(
    tree,
    (node) => node.props?.className === "mobileFormatToggle",
  );
  expect(toggle).not.toBeNull();
  expect(toggle.props.children).toBe("Formatar texto");
  expect(toggle.props["aria-expanded"]).toBe(false);
  const panel = find(tree, (node) => node.props?.role === "group");
  expect(toggle.props["aria-controls"]).toBe(panel.props.id);
  expect(panel.props["data-mobile-open"]).toBe(false);
  const preventDefault = jest.fn();
  toggle.props.onPointerDown({ preventDefault });
  expect(preventDefault).toHaveBeenCalledTimes(1);
});
