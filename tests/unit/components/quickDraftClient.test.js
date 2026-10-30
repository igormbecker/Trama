import { createQuickDraftStarter } from "components/home/quickDraftClient";

const userId = "owner";
function setup({ storage } = {}) {
  const values = new Map();
  const browserStorage = storage || {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const fetcher = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ work_id: "work", chapter_id: "chapter" }),
  });
  const navigate = jest.fn().mockResolvedValue(true);
  const options = {
    userId,
    storage: browserStorage,
    fetcher,
    navigate,
    timeZone: "America/Sao_Paulo",
  };
  return {
    fetcher,
    navigate,
    options,
    values,
    starter: createQuickDraftStarter(options),
  };
}
test("Opens the created chapter in writing mode and clears the attempt only after navigation", async () => {
  const { starter, fetcher, navigate, values } = setup();
  await starter.start();
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
    time_zone: "America/Sao_Paulo",
    request_id: expect.any(String),
  });
  expect(navigate).toHaveBeenCalledWith("/works/work/chapters/chapter?write=1");
  expect(values.size).toBe(0);
});
test("An uncertain network failure retries the same attempt after a reload", async () => {
  const { starter, fetcher, options } = setup();
  fetcher.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await expect(starter.start()).rejects.toThrow("Não foi possível abrir");
  const first = fetcher.mock.calls[0][1].body;
  await createQuickDraftStarter(options).start();
  expect(fetcher.mock.calls[1][1].body).toBe(first);
});
test("Failed navigation opens the known draft again without another POST", async () => {
  const { starter, fetcher, navigate, values } = setup();
  navigate.mockResolvedValueOnce(false);
  await expect(starter.start()).rejects.toThrow("rascunho já foi criado");
  expect(values.size).toBe(1);
  expect(starter.destination()).toBe("/works/work/chapters/chapter?write=1");
  await starter.start();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(values.size).toBe(0);
});
test("A removed draft clears its attempt so an explicit next click can create another", async () => {
  const { starter, fetcher } = setup();
  fetcher.mockResolvedValueOnce({ ok: false, status: 409 });
  await expect(starter.start()).rejects.toThrow("não está mais disponível");
  const first = JSON.parse(fetcher.mock.calls[0][1].body).request_id;
  await starter.start();
  expect(JSON.parse(fetcher.mock.calls[1][1].body).request_id).not.toBe(first);
});
test("Blocked storage still allows retries using the in-memory attempt", async () => {
  const blocked = () => {
    throw new Error("Storage blocked");
  };
  const { starter, fetcher } = setup({
    storage: { getItem: blocked, setItem: blocked, removeItem: blocked },
  });
  fetcher.mockRejectedValueOnce(new TypeError("Offline"));
  await expect(starter.start()).rejects.toThrow();
  await starter.start();
  expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[0][1].body);
});
test("A repeated activation while pending shares the first request", async () => {
  const { starter, fetcher } = setup();
  await Promise.all([starter.start(), starter.start()]);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test("Pending attempts are isolated by account", async () => {
  const { starter, fetcher, options } = setup();
  fetcher.mockRejectedValueOnce(new Error("Offline"));
  await expect(starter.start()).rejects.toThrow();
  await createQuickDraftStarter({ ...options, userId: "other" }).start();
  expect(fetcher.mock.calls[1][1].body).not.toBe(fetcher.mock.calls[0][1].body);
});

test("A stalled response body times out and preserves its attempt for retry", async () => {
  jest.useFakeTimers();
  try {
    const { starter, fetcher, values } = setup();
    let rejectBody;
    fetcher.mockImplementationOnce(async (_path, { signal }) => ({
      ok: true,
      json: () =>
        new Promise((_resolve, reject) => {
          rejectBody = reject;
          signal.addEventListener("abort", () => reject(new Error("Aborted")));
        }),
    }));
    const result = starter.start().then(
      () => null,
      (error) => error,
    );
    await jest.advanceTimersByTimeAsync(20000);
    rejectBody(new Error("Connection closed"));
    const failure = await result;
    expect(failure).toBeInstanceOf(Error);
    expect(failure.message).toContain("Não foi possível abrir");
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    expect(values.size).toBe(1);
    await starter.start();
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[0][1].body);
  } finally {
    jest.useRealTimers();
  }
});
