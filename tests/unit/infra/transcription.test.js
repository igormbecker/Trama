import { createServer } from "node:http";
import { transcribeAudio } from "infra/transcription";
test("Sends multipart audio to Groq with a server-only key and returns text", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Uma ideia.", duration: 8 }),
    });
  const result = await transcribeAudio(Buffer.from("audio"), "audio/webm", {
    apiKey: "test-key",
    fetcher,
  });
  expect(result).toBe("Uma ideia.");
  expect(fetcher.mock.calls[0][0]).toBe(
    "https://api.groq.com/openai/v1/audio/transcriptions",
  );
  const request = fetcher.mock.calls[0][1];
  expect(request.headers.Authorization).toBe("Bearer test-key");
  expect(request.body.get("model")).toBe("whisper-large-v3-turbo");
});
test("Missing configuration and upstream errors never leak provider details", async () => {
  await expect(
    transcribeAudio(Buffer.from("a"), "audio/webm", { apiKey: "" }),
  ).rejects.toThrow("não está configurada");
  const fetcher = jest.fn().mockResolvedValue({ ok: false, status: 429 });
  await expect(
    transcribeAudio(Buffer.from("a"), "audio/webm", {
      apiKey: "secret",
      fetcher,
    }),
  ).rejects.toThrow("limite");
});
test("Rejects empty audio and unsupported types before contacting the provider", async () => {
  const fetcher = jest.fn();
  await expect(
    transcribeAudio(Buffer.alloc(0), "audio/webm", { apiKey: "key", fetcher }),
  ).rejects.toThrow();
  await expect(
    transcribeAudio(Buffer.from("a"), "text/html", { apiKey: "key", fetcher }),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test("Exercises actual multipart HTTP and handles an upstream outage without leaking the response", async () => {
  let upstreamStatus = 200;
  const received = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    received.push({
      type: request.headers["content-type"],
      body: Buffer.concat(chunks).toString(),
    });
    response.writeHead(upstreamStatus, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify(
        upstreamStatus === 200
          ? { text: "Ideia de teste.", duration: 1 }
          : { error: "private upstream details" },
      ),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const fetcher = (_url, options) =>
    fetch(`http://127.0.0.1:${address.port}/audio/transcriptions`, options);
  try {
    expect(
      await transcribeAudio(Buffer.from("synthetic-audio"), "audio/mp4", {
        apiKey: "fake",
        fetcher,
      }),
    ).toBe("Ideia de teste.");
    expect(received[0].type).toContain("multipart/form-data; boundary=");
    expect(received[0].body).toContain('name="file"; filename="recording.mp4"');
    expect(received[0].body).toContain("synthetic-audio");
    upstreamStatus = 503;
    await expect(
      transcribeAudio(Buffer.from("synthetic-audio"), "audio/mp4", {
        apiKey: "fake",
        fetcher,
      }),
    ).rejects.toThrow("Não foi possível transcrever");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
