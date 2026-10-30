import { ValidationError } from "infra/errors.js";

export const maximumAudioBytes = 4 * 1024 * 1024;
const formats = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export async function transcribeAudio(
  audio,
  contentType,
  {
    apiKey = process.env.GROQ_API_KEY,
    fetcher = fetch,
    includeDuration = false,
  } = {},
) {
  const mimeType = contentType?.split(";")[0].trim().toLowerCase();
  if (
    !formats[mimeType] ||
    !audio?.length ||
    audio.length > maximumAudioBytes
  ) {
    throw new ValidationError({
      message: "Áudio inválido. Use uma gravação de até 2 minutos e 4 MB.",
    });
  }
  if (!apiKey) {
    throw new ValidationError({
      message: "A transcrição ainda não está configurada no Trama.",
    });
  }
  const form = new FormData();
  form.set(
    "file",
    new Blob([audio], { type: mimeType }),
    `recording.${formats[mimeType]}`,
  );
  form.set("model", "whisper-large-v3-turbo");
  form.set("language", "pt");
  form.set("response_format", "verbose_json");
  form.set("temperature", "0");
  let response;
  try {
    response = await fetcher(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(55000),
      },
    );
  } catch {
    throw new ValidationError({
      message:
        "A transcrição não respondeu. Seu áudio continua nesta tela; tente novamente.",
    });
  }
  if (!response.ok) {
    throw new ValidationError({
      message:
        response.status === 429
          ? "A transcrição atingiu o limite temporário. Seu áudio continua nesta tela; tente mais tarde."
          : "Não foi possível transcrever agora. Seu áudio continua nesta tela; tente novamente.",
    });
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ValidationError({
      message: "A transcrição retornou uma resposta inválida. Tente novamente.",
    });
  }
  if (
    typeof result.text !== "string" ||
    !result.text.trim() ||
    result.text.length > 50000
  ) {
    throw new ValidationError({
      message:
        "Não foi possível reconhecer texto neste áudio. Confira a gravação.",
    });
  }
  if (typeof result.duration === "number" && result.duration > 122) {
    throw new ValidationError({
      message: "A gravação ultrapassa o limite de 2 minutos.",
    });
  }
  const text = result.text.trim();
  return includeDuration ? { text, duration: result.duration } : text;
}
