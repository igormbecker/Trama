import { renderToStaticMarkup } from "react-dom/server";
import useActionState from "components/shared/useActionState";

test("Blocks two invocations before React renders again and releases after failure", async () => {
  let invoke;
  let rejectOperation;
  const operation = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        rejectOperation = reject;
      }),
  );
  function Fixture() {
    const [, setPending, pendingRef] = useActionState();
    invoke = async () => {
      if (pendingRef.current) return;
      setPending(true);
      try {
        await operation();
      } finally {
        setPending(false);
      }
    };
    return null;
  }
  renderToStaticMarkup(<Fixture />);
  const first = invoke();
  await invoke();
  expect(operation).toHaveBeenCalledTimes(1);
  rejectOperation(new Error("Offline"));
  await expect(first).rejects.toThrow("Offline");
  operation.mockResolvedValueOnce();
  await invoke();
  expect(operation).toHaveBeenCalledTimes(2);
});
