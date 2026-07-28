/**
 * lyriaClient.js
 *
 * Thin adapter around the OpenRouter Chat Completions endpoint for the
 * Lyria 3 music models. Everything specific to OpenRouter / Lyria lives
 * here so the rest of the app never has to care about wire format.
 *
 * NOTE ON THE RESPONSE SHAPE
 * --------------------------
 * OpenRouter is OpenAI-compatible, but the exact location of the returned
 * audio for the Lyria models is not fully documented publicly. Rather than
 * guess a single path and break, `extractAudio()` scans every plausible
 * location (base64 or URL). If none match, we throw an error that includes
 * a trimmed copy of the raw JSON so the shape can be confirmed on the first
 * live call and pinned down here.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
  pro: "google/lyria-3-pro-preview",
  clip: "google/lyria-3-clip-preview",
};

/** Map a format hint to a MIME type. */
function mimeFor(format) {
  const f = String(format || "").toLowerCase();
  if (f.includes("wav")) return "audio/wav";
  if (f.includes("ogg")) return "audio/ogg";
  if (f.includes("flac")) return "audio/flac";
  return "audio/mpeg"; // mp3 default
}

// Turn a raw provider error into a clearer, actionable Error. Content-policy
// blocks from Google's safety filter get a helpful explanation.
function describeError(rawMsg) {
  const raw = String(rawMsg || "");
  const blocked = /prohibit|safety|blocked|content.?polic|moderat|flagged|recitation|responsible\s*ai/i.test(raw);
  const err = new Error(
    blocked
      ? "Blocked by Lyria's content safety filter. This usually means a real artist or song was referenced, the reference image contained a recognizable person/logo, or a lyric theme was flagged. Try removing artist names, rewording or shortening the lyrics, or changing/removing the reference image — then generate again (a new seed sometimes clears a borderline case)."
      : `OpenRouter error: ${raw}`
  );
  err.raw = raw;
  err.blocked = blocked;
  return err;
}

/**
 * Walk a response object looking for generated audio.
 * @returns {{ kind: 'base64'|'url', data: string, mimeType: string } | null}
 */
export function extractAudio(data) {
  if (!data || typeof data !== "object") return null;

  const message = data?.choices?.[0]?.message;

  // 1) message.audio = { data | url, format }
  const audioObj = message?.audio;
  if (audioObj) {
    if (typeof audioObj.data === "string" && audioObj.data.length > 0) {
      return { kind: "base64", data: audioObj.data, mimeType: mimeFor(audioObj.format) };
    }
    if (typeof audioObj.url === "string" && audioObj.url) {
      return { kind: "url", data: audioObj.url, mimeType: mimeFor(audioObj.format) };
    }
  }

  // 2) message.content is an array of typed parts
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (!part || typeof part !== "object") continue;
      const inner = part.audio || part.output_audio || part.input_audio || part;
      if (typeof inner?.data === "string" && inner.data.length > 0) {
        return { kind: "base64", data: inner.data, mimeType: mimeFor(inner.format) };
      }
      if (typeof inner?.url === "string" && inner.url) {
        return { kind: "url", data: inner.url, mimeType: mimeFor(inner.format) };
      }
    }
  }

  // 3) message.content is a plain string that is itself a data: or http URL
  if (typeof message?.content === "string") {
    const s = message.content.trim();
    if (s.startsWith("data:audio")) {
      const comma = s.indexOf(",");
      const mimeType = s.slice(5, s.indexOf(";")) || "audio/mpeg";
      return { kind: "base64", data: s.slice(comma + 1), mimeType };
    }
    if (/^https?:\/\/\S+$/.test(s)) {
      return { kind: "url", data: s, mimeType: "audio/mpeg" };
    }
  }

  // 4) Top-level fallbacks some providers use
  for (const key of ["audio", "data", "output"]) {
    const v = data[key];
    if (typeof v === "string" && v.length > 100) {
      return { kind: "base64", data: v, mimeType: "audio/mpeg" };
    }
  }

  return null;
}

/**
 * Generate music.
 *
 * @param {object} opts
 * @param {string} opts.prompt      - The text prompt.
 * @param {string} opts.apiKey      - OpenRouter API key.
 * @param {string} [opts.model]     - "pro" | "clip" | full model id.
 * @param {string} [opts.format]    - "mp3" (default) | "wav" (Pro only).
 * @param {object} [opts.headers]   - Extra headers (HTTP-Referer, X-Title).
 * @returns {Promise<{ audio: {kind,data,mimeType}, raw: object }>}
 */
export async function generateMusic({ prompt, apiKey, model = "pro", format = "mp3", seed, image, headers = {} }) {
  if (!apiKey) throw new Error("Missing OpenRouter API key.");
  if (!prompt || !prompt.trim()) throw new Error("Prompt is empty.");

  const modelId = MODELS[model] || model;

  const body = {
    model: modelId,
    // Ask explicitly for audio output; harmless if the model returns it anyway.
    modalities: ["audio"],
    // The Lyria audio models require streaming — audio arrives as base64
    // chunks over Server-Sent Events, which we reassemble below.
    stream: true,
    messages: [{ role: "user", content: prompt }],
  };

  // A seed makes generation reproducible; the server always supplies one.
  if (Number.isFinite(seed)) body.seed = seed;

  // Reference image: Lyria takes a single top-level `image` (URL or data URI).
  if (image) body.image = image;

  // Output format is selected via `response_format`. Only send it for a
  // non-default (wav) request so mp3 generations keep the plain default path.
  if (format && format !== "mp3") {
    body.response_format = format; // e.g. "wav" (Lyria 3 Pro only)
  }

  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Network error contacting OpenRouter: ${networkErr.message}`);
  }

  // Errors come back as a normal (non-stream) JSON body.
  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text);
      msg = j?.error?.message || j?.message || msg;
    } catch {
      if (text) msg += `: ${text.slice(0, 300)}`;
    }
    throw describeError(msg);
  }

  return await consumeAudioStream(res);
}

/**
 * Read an SSE stream and reassemble the generated audio.
 * Accumulates base64 chunks from `choices[].delta.audio.data` (and the
 * single-shot `message.audio` form), then returns the combined result.
 */
async function consumeAudioStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let audioB64 = "";
  let format = "";
  let transcript = "";
  let streamErr = null;

  const handleEvent = (payload) => {
    if (payload === "[DONE]") return;
    let obj;
    try {
      obj = JSON.parse(payload);
    } catch {
      return; // ignore unparseable keep-alives / partials
    }
    if (obj.error) {
      streamErr = obj.error.message || "Unknown streaming error";
      return;
    }
    const choice = obj.choices?.[0];
    const audio = choice?.delta?.audio || choice?.message?.audio;
    if (audio) {
      if (typeof audio.data === "string") audioB64 += audio.data;
      if (audio.format && !format) format = audio.format;
      if (typeof audio.transcript === "string") transcript += audio.transcript;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE lines are newline-delimited; data payloads start with "data:".
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line || line.startsWith(":")) continue; // blank or comment/keep-alive
      if (line.startsWith("data:")) handleEvent(line.slice(5).trim());
    }
  }

  if (streamErr) throw describeError(streamErr);

  if (!audioB64) {
    const err = new Error(
      "Stream finished but no audio data was received. See server log for details."
    );
    err.raw = `format=${format || "?"} transcriptChars=${transcript.length}`;
    throw err;
  }

  return {
    audio: { kind: "base64", data: audioB64, mimeType: mimeFor(format) },
    raw: { bytesBase64: audioB64.length, format, transcript },
  };
}
