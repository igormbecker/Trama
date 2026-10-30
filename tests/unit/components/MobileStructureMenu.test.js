import MobileStructureMenu from "components/works/MobileStructureMenu";

const mockDialog = { showModal: jest.fn(), close: jest.fn() };
const mockSetOpen = jest.fn();
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: () => [false, mockSetOpen],
  useRef: () => ({ current: mockDialog }),
  useId: () => "options-heading",
  useEffect: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
function menu() {
  return MobileStructureMenu({
    label: "Opções da parte",
    title: "Parte 1",
    children: null,
  });
}

test("Opens a native modal and exposes its visibility to the trigger", () => {
  const trigger = menu().props.children[0];
  expect(trigger.props["aria-expanded"]).toBe(false);
  trigger.props.onClick();
  expect(mockDialog.showModal).toHaveBeenCalledTimes(1);
  expect(mockSetOpen).toHaveBeenCalledWith(true);
});

test.each([
  [false, false, true],
  [true, false, false],
  [false, true, false],
])(
  "Closes for an enabled action but preserves the trash confirmation (disabled=%s, trash=%s)",
  (disabled, trash, shouldClose) => {
    const dialog = menu().props.children[1];
    const options = dialog.props.children[3];
    options.props.onClickCapture({
      target: {
        closest: () => ({ disabled, classList: { contains: () => trash } }),
      },
    });
    expect(mockDialog.close).toHaveBeenCalledTimes(shouldClose ? 1 : 0);
  },
);

test("Escape updates the expanded state", () => {
  menu().props.children[1].props.onCancel();
  expect(mockSetOpen).toHaveBeenCalledWith(false);
});
