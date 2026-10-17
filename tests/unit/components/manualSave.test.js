import { runManualSave } from "components/works/manualSave.js";

test("Keeps manual save feedback visible even when no request is needed", async () => {
  jest.useFakeTimers();
  const showSaving = jest.fn();
  const save = jest.fn().mockResolvedValue(undefined);
  const pending = runManualSave(save, showSaving);
  expect(showSaving).toHaveBeenCalledWith(true);
  await jest.advanceTimersByTimeAsync(399);
  expect(showSaving).not.toHaveBeenCalledWith(false);
  await jest.advanceTimersByTimeAsync(1);
  await pending;
  expect(save).toHaveBeenCalledTimes(1);
  expect(showSaving).toHaveBeenLastCalledWith(false);
  jest.useRealTimers();
});

test("Clears the loading state after a failed save without hiding the error", async () => {
  jest.useFakeTimers();
  const showSaving = jest.fn();
  const failure = new Error("offline");
  const pending = runManualSave(() => Promise.reject(failure), showSaving);
  await Promise.all([
    expect(pending).rejects.toThrow("offline"),
    jest.advanceTimersByTimeAsync(400),
  ]);
  expect(showSaving).toHaveBeenLastCalledWith(false);
  jest.useRealTimers();
});
