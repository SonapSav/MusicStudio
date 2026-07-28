/**
 * enhanceClient.js
 *
 * Uses a text model (Claude Sonnet by default) to write concise ARRANGEMENT /
 * PRODUCTION direction for the "Extra details" field — timestamped sections,
 * instrument entrances, builds, drops and mix textures — informed by the
 * track's style settings and (crucially) its lyrics and target duration.
 *
 * Like the lyrics client, this is a normal non-streaming chat completion.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_ENHANCE_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You are a music producer and arranger writing production direction for an AI music generator (Google Lyria 3). You are given a track's style settings and, when available, its lyrics. Write vivid, specific arrangement notes that add creativity beyond the basic style.

Rules:
- Output ONLY the direction text — no titles, labels, preamble, or commentary.
- Use timestamp ranges like [0:00 - 0:15] to mark sections and shifts, staying within the target duration.
- If lyrics with [Verse]/[Chorus]/[Bridge] are provided, align your timestamps and energy arc to that structure.
- Name specific instrument entrances/exits, dynamics, builds, drops, transitions and mix textures.
- Do NOT restate the genre, era or mood words already chosen — add NEW detail instead.
- Do NOT rewrite, quote or include the lyrics themselves.
- Scale length to the target duration: ~40–70 words for a 30-second clip, ~110–160 words for a full track. Be concise but complete — always finish your final sentence.`;

const asList = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []);
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const listStr = (v) => asList(v).map(clean).filter(Boolean).join(", ");

/** Assemble the producer brief from the form data. */
function buildBrief(p = {}) {
  const isClip = p.model === "clip";
  const lines = [];
  lines.push(
    isClip
      ? "Target length: about 30 seconds (a short, loop-friendly clip — keep the arc compact)."
      : "Target length: a full track up to ~3 minutes — design a clear beginning/middle/end arc."
  );

  if (clean(p.genre)) lines.push(`Genre/style: ${clean(p.genre)}`);
  if (clean(p.era)) lines.push(`Era: ${clean(p.era)}`);
  if (listStr(p.moods)) lines.push(`Mood: ${listStr(p.moods)}`);
  if (listStr(p.atmosphere)) lines.push(`Atmosphere: ${listStr(p.atmosphere)}`);
  if (listStr(p.instrumentation)) lines.push(`Instrumentation available: ${listStr(p.instrumentation)}`);

  const tempo = [clean(String(p.bpm ?? "")) && `${clean(String(p.bpm))} BPM`, clean(p.tempoDescriptive)]
    .filter(Boolean).join(", ");
  if (tempo) lines.push(`Tempo/feel: ${tempo}`);

  if (p.instrumental) {
    lines.push("Vocals: instrumental only (no vocals).");
  } else {
    const vox = [listStr(p.vocalTexture), listStr(p.vocalGender)].filter(Boolean).join(" ");
    if (vox) lines.push(`Vocals: ${vox}`);
    if (clean(p.language)) lines.push(`Language: ${clean(p.language)}`);
  }

  const lyrics = clean(p.lyrics);
  if (!p.instrumental && lyrics) {
    lines.push("\nLyrics (for structure/timing reference only — do not repeat them):\n" + lyrics);
  }

  return lines.join("\n");
}

/** Strip accidental code fences a model might add. */
function cleanText(text) {
  return (text || "").trim().replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

/**
 * Generate arrangement direction.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {object} opts.params   - form data (genre, moods, instrumentation, lyrics, model, …)
 * @param {string} [opts.model]
 * @param {object} [opts.headers]
 * @returns {Promise<{ details: string, model: string }>}
 */
export async function generateArrangement({ apiKey, params = {}, model = DEFAULT_ENHANCE_MODEL, headers = {} }) {
  if (!apiKey) throw new Error("Missing OpenRouter API key.");

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildBrief(params) },
    ],
    temperature: 0.85,
    max_tokens: 700,
  };

  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Network error contacting OpenRouter: ${networkErr.message}`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`OpenRouter returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`Enhance model error: ${msg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  const details = cleanText(typeof content === "string" ? content : "");
  if (!details) throw new Error("The model returned no arrangement text.");

  return { details, model };
}
