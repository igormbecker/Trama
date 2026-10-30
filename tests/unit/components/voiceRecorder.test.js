import {
  createVoiceRecorder,
  textToParagraphs,
} from "components/voice/voiceRecorder";

function setup() {
  let now = 0;
  const track = { stop: jest.fn() };
  class Recorder {
    static isTypeSupported() {
      return true;
    }
    constructor(stream, options) {
      this.mimeType = options.mimeType;
      this.state = "inactive";
    }
    start() {
      this.state = "recording";
    }
    pause() {
      this.state = "paused";
    }
    resume() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["audio"]) });
      this.onstop?.();
    }
  }
  const recorder = createVoiceRecorder({
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) },
    Recorder,
    now: () => now,
  });
  return {
    recorder,
    track,
    advance: (milliseconds) => {
      now += milliseconds;
    },
  };
}
test("Pauses do not consume recording time and reaching four minutes stops capture", async () => {
  const { recorder, advance, track } = setup();
  await recorder.start();
  advance(30000);
  recorder.pause();
  advance(90000);
  expect(recorder.elapsed()).toBe(30000);
  recorder.resume();
  advance(90000);
  recorder.tick();
  expect(recorder.state()).toBe("recording");
  expect(recorder.elapsed()).toBe(120000);
  advance(120000);
  recorder.tick();
  expect(recorder.state()).toBe("finished");
  expect(recorder.elapsed()).toBe(240000);
  expect(track.stop).toHaveBeenCalled();
  expect(recorder.audio().size).toBeGreaterThan(0);
});
test("Discard releases the microphone and clears audio", async () => {
  const { recorder, track } = setup();
  await recorder.start();
  recorder.discard();
  expect(recorder.audio()).toBeNull();
  expect(recorder.state()).toBe("idle");
  expect(track.stop).toHaveBeenCalled();
});
test("Transcript is inserted as plain paragraphs, never HTML", () => {
  expect(textToParagraphs("Olá.\n\n<script>teste</script>")).toEqual([
    { type: "paragraph", content: [{ type: "text", text: "Olá." }] },
    {
      type: "paragraph",
      content: [{ type: "text", text: "<script>teste</script>" }],
    },
  ]);
});
