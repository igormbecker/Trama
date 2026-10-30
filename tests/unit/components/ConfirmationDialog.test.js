import { ConfirmationDialog } from "components/shared/useConfirmation";
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: () => ({ current: null }),
  useId: () => "confirmation",
  useEffect: jest.fn(),
}));
test("Shows an accessible confirmation and preserves cancel and accept actions", () => {
  const onDecision = jest.fn();
  const dialog = ConfirmationDialog({
    request: {
      title: "Descartar gravação?",
      message: "O áudio será descartado.",
      confirmLabel: "Descartar",
      danger: true,
    },
    onDecision,
  });
  expect(dialog.type).toBe("dialog");
  const actions = dialog.props.children[2].props.children;
  actions[0].props.onClick();
  expect(onDecision).toHaveBeenLastCalledWith(true);
  actions[1].props.onClick();
  expect(onDecision).toHaveBeenLastCalledWith(false);
  const preventDefault = jest.fn();
  dialog.props.onCancel({ preventDefault });
  expect(preventDefault).toHaveBeenCalled();
  expect(onDecision).toHaveBeenLastCalledWith(false);
});
test("Does not render when no decision is pending", () => {
  expect(
    ConfirmationDialog({ request: null, onDecision: jest.fn() }),
  ).toBeNull();
});
