/**
 * nameClient.js
 *
 * Suggests a short song title for an already-generated track, based on the
 * lyrics contained in its stored prompt (with the style as light context).
 * A normal non-streaming chat completion, like the lyrics/arrangement clients.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_NAME_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You name music tracks. You are given EITHER a song's lyrics, or — for an instrumental — a description of its musical style. Return one short, evocative title.

Rules:
- Output ONLY the title — no quotation marks, no trailing punctuation, no commentary.
- Keep it to about 2–5 words.
- If LYRICS are given: draw the title from their imagery or theme, and write it in the SAME language as the lyrics (e.g. Greek lyrics → a Greek title).
- If only a STYLE is given (instrumental): invent a creative, evocative title that captures the mood, genre and instruments — imaginative and specific, never generic like "Instrumental Track".
- Never invent content unrelated to what you were given.`;

function cleanTitle(text) {
  let t = (text || "").trim().split("\n")[0].trim();
  t = t.replace(/^["'“”«»\s]+|["'“”«».\s]+$/g, ""); // strip wrapping quotes/punctuation
  return t.slice(0, 80);
}

/**
 * Name a track from its lyrics, or — if none — creatively from its style.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} [opts.lyrics] - lyrics to name from (preferred when present)
 * @param {string} [opts.style]  - style/prompt text (used when there are no lyrics)
 * @param {string} [opts.model]
 * @param {object} [opts.headers]
 * @returns {Promise<{ name: string, model: string }>}
 */
export async function generateTitle({ apiKey, lyrics = "", style = "", model = DEFAULT_NAME_MODEL, headers = {} }) {
  if (!apiKey) throw new Error("Missing OpenRouter API key.");
  const hasLyrics = Boolean(lyrics && lyrics.trim());
  if (!hasLyrics && !(style && style.trim())) {
    throw new Error("Nothing to name this track from.");
  }

  const user = hasLyrics
    ? (style ? `Style: ${style.trim()}\n\n` : "") + `Lyrics:\n${lyrics.trim()}`
    : `Instrumental track. Musical style:\n${style.trim()}`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: 24,
    }),
  }).catch((e) => { throw new Error(`Network error contacting OpenRouter: ${e.message}`); });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`OpenRouter returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(`Naming model error: ${data?.error?.message || `HTTP ${res.status}`}`);

  const name = cleanTitle(data?.choices?.[0]?.message?.content);
  if (!name) throw new Error("The model returned no title.");
  return { name, model };
}

/** Pull the lyrics out of a built prompt (everything after the "Lyrics:" marker). */
export function extractLyrics(prompt = "") {
  const idx = prompt.search(/\n?\s*Lyrics:\s*/i);
  if (idx === -1) return { style: prompt.trim(), lyrics: "" };
  const style = prompt.slice(0, idx).trim();
  const lyrics = prompt.slice(idx).replace(/^\n?\s*Lyrics:\s*/i, "").trim();
  return { style, lyrics };
}
