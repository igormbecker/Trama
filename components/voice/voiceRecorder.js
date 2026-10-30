export const maximumRecordingMilliseconds = 120000;
export const maximumAudioBytes = 4 * 1024 * 1024;

export function textToParagraphs(text) {
  return text
    .trim()
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line.trim() }],
    }));
}

export function createVoiceRecorder({
  mediaDevices,
  Recorder,
  now = () => performance.now(),
  onChange = () => {},
}) {
  let recorder;
  let stream;
  let chunks = [];
  let blob = null;
  let status = "idle";
  let accumulated = 0;
  let startedAt = 0;
  let discarded = false;
  let bytes = 0;

  function release() {
    stream?.getTracks().forEach((track) => track.stop());
  }
  function elapsed() {
    const current =
      status === "recording" ? accumulated + now() - startedAt : accumulated;
    return Math.min(maximumRecordingMilliseconds, current);
  }
  function finish() {
    if (!recorder || !["recording", "paused"].includes(status)) {
      return;
    }
    accumulated = elapsed();
    status = "finishing";
    if (recorder.state === "inactive") {
      blob = new Blob(chunks, { type: recorder.mimeType });
      status = "finished";
    } else {
      recorder.stop();
    }
    release();
    onChange();
  }
  return {
    async start() {
      if (status !== "idle") {
        return;
      }
      if (!mediaDevices?.getUserMedia || !Recorder) {
        throw new Error(
          "A gravação não está disponível. Use um navegador compatível e uma conexão HTTPS.",
        );
      }
      status = "starting";
      discarded = false;
      try {
        stream = await mediaDevices.getUserMedia({ audio: true });
        if (discarded) {
          release();
          return;
        }
        const mimeType = [
          "audio/webm;codecs=opus",
          "audio/mp4",
          "audio/webm",
        ].find((type) => Recorder.isTypeSupported(type));
        recorder = new Recorder(
          stream,
          mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined,
        );
        recorder.ondataavailable = (event) => {
          if (!discarded && event.data.size) {
            chunks.push(event.data);
            bytes += event.data.size;
            if (bytes >= maximumAudioBytes) {
              finish();
            }
          }
        };
        recorder.onstop = () => {
          if (!discarded) {
            blob = new Blob(chunks, { type: recorder.mimeType });
            status = "finished";
          }
          onChange();
        };
        recorder.onerror = () => {
          finish();
        };
        recorder.start(1000);
        startedAt = now();
        status = "recording";
        onChange();
      } catch {
        release();
        status = "idle";
        throw new Error(
          "Não foi possível acessar o microfone. Confira a permissão do navegador.",
        );
      }
    },
    pause() {
      if (status === "recording") {
        accumulated = elapsed();
        recorder.pause();
        status = "paused";
        onChange();
      }
    },
    resume() {
      if (status === "paused") {
        recorder.resume();
        startedAt = now();
        status = "recording";
        onChange();
      }
    },
    finish,
    tick() {
      if (status === "recording" && elapsed() >= maximumRecordingMilliseconds) {
        finish();
      }
      onChange();
    },
    discard() {
      discarded = true;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      release();
      chunks = [];
      blob = null;
      bytes = 0;
      accumulated = 0;
      status = "idle";
      onChange();
    },
    elapsed,
    state: () => status,
    audio: () => blob,
  };
}
