/**
 * lyricsClient.js
 *
 * Generates ORIGINAL song lyrics with a text model (Claude Sonnet by default)
 * through the same OpenRouter endpoint used for music. The lyrics come back
 * with Lyria-style section markers ([Verse], [Chorus], …) ready to drop into
 * the Lyrics box.
 *
 * This is a normal (non-streaming) chat completion — unlike the Lyria audio
 * models, text models return the full message in one JSON response.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_LYRICS_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `You are a professional songwriter. Write ORIGINAL song lyrics from the user's brief.

Rules:
- Output ONLY the lyrics. No titles, no chords, no commentary, no explanations.
- Use section markers on their own lines: [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro].
- Every lyric must be 100% original. Never imitate, quote, or reproduce any real artist, band, or existing copyrighted song. If the brief names a real artist or song, take only general stylistic inspiration and write something wholly new.
- Match the requested theme, mood, genre and language. If a language other than English is requested, write the lyrics in that language.
- Keep lines singable and rhythmic; use natural rhyme where it fits.
- You may use parentheses for background echoes, e.g. "Hold on (hold on)".`;

/** Assemble the user brief from the structured inputs. */
function buildBrief(p = {}) {
  const lines = [];
  if (p.theme) lines.push(`Theme / topic: ${p.theme}`);
  if (p.story) lines.push(`Story, details or keywords to include: ${p.story}`);
  if (p.genre) lines.push(`Genre / style: ${p.genre}`);
  if (Array.isArray(p.moods) && p.moods.length) lines.push(`Mood: ${p.moods.join(", ")}`);
  if (p.language) lines.push(`Language: ${p.language}`);
  if (p.structure) lines.push(`Preferred structure: ${p.structure}`);
  if (p.rhyme) lines.push(`Rhyme style: ${p.rhyme}`);
  lines.push(`Content: ${p.explicit ? "explicit language allowed" : "keep it clean (no explicit language)"}`);
  if (!lines.some((l) => l.startsWith("Theme"))) {
    lines.unshift("Theme / topic: (writer's choice — pick something evocative)");
  }
  return lines.join("\n");
}

/** Strip accidental code fences / preamble a model might add. */
function cleanLyrics(text) {
  let t = (text || "").trim();
  t = t.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
  return t;
}

/**
 * Generate lyrics.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {object} opts.params            - theme, story, moods, genre, language, structure, rhyme, explicit
 * @param {string} [opts.model]
 * @param {object} [opts.headers]
 * @returns {Promise<{ lyrics: string, model: string }>}
 */
export async function generateLyrics({ apiKey, params = {}, model = DEFAULT_LYRICS_MODEL, headers = {} }) {
  if (!apiKey) throw new Error("Missing OpenRouter API key.");

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildBrief(params) },
    ],
    temperature: 0.9,
    max_tokens: 900,
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
    throw new Error(`Lyrics model error: ${msg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  const lyrics = cleanLyrics(typeof content === "string" ? content : "");
  if (!lyrics) throw new Error("The lyrics model returned no text.");

  return { lyrics, model };
}
