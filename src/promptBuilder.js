/**
 * promptBuilder.js
 *
 * Turns the structured form data collected from the UI into a single
 * text prompt shaped for Lyria 3, following the framework in the
 * "Lyria 3 Pro - Prompting Reference Guide":
 *
 *   [Genre/Era] + [Mood] + [Instrumentation] + [Tempo/Rhythm] +
 *   [Vocals/Language] + [Lyrics]
 *
 * The output is a natural-language sentence (or two), because Lyria
 * responds best to descriptive prose rather than key:value pairs —
 * except for the special `Lyrics:` marker and `[Section]` / timestamp
 * tokens, which the guide says to pass through verbatim.
 */

/** Small helpers ---------------------------------------------------------- */

const clean = (v) => (typeof v === "string" ? v.trim() : "");

// Turn ["a", "b", "c"] into "a, b, and c".
function joinList(items) {
  const list = items.map(clean).filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

// Accept either an array or a comma-separated string from the form.
function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",");
  return [];
}

/**
 * Build the prompt.
 *
 * @param {object} data - Raw form fields (see UI). All optional.
 * @returns {{ prompt: string, warnings: string[] }}
 */
export function buildPrompt(data = {}) {
  const warnings = [];

  const era = clean(data.era);
  const genre = clean(data.genre);
  const moods = asList(data.moods);
  const atmospheres = asList(data.atmosphere);
  const instrumentation = asList(data.instrumentation);
  const bpm = clean(String(data.bpm ?? ""));
  const tempoDescriptive = clean(data.tempoDescriptive);
  const key = clean(data.key);
  const timeSignature = clean(data.timeSignature);
  const mode = clean(data.mode);
  const instrumental = Boolean(data.instrumental);
  const vocalGenders = asList(data.vocalGender);
  const vocalTextures = asList(data.vocalTexture);
  const language = clean(data.language);
  const lyrics = clean(data.lyrics);
  const extra = clean(data.extraDetails);

  // --- 1. Lead clause: [Mood] [Era] [Genre] ------------------------------
  // e.g. "A nostalgic, dreamy 1980s synthwave track"
  const leadParts = [];
  const moodPhrase = joinList(moods);
  if (moodPhrase) leadParts.push(moodPhrase.toLowerCase());
  if (era) leadParts.push(era);
  if (genre) leadParts.push(genre.toLowerCase());

  let lead;
  if (leadParts.length) {
    const descriptor = leadParts.join(" ");
    const article = /^[aeiou]/i.test(descriptor) ? "An" : "A";
    lead = `${article} ${descriptor} track`;
  } else {
    lead = "A music track";
    warnings.push("No genre, era, or mood set — the prompt will be very open-ended.");
  }

  const sentences = [];
  let opener = lead;
  const atmospherePhrase = joinList(atmospheres);
  if (atmospherePhrase) opener += ` with a ${atmospherePhrase.toLowerCase()} atmosphere`;
  sentences.push(opener + ".");

  // --- 2. Instrumentation ------------------------------------------------
  const instrPhrase = joinList(instrumentation);
  if (instrPhrase) {
    sentences.push(`Featuring ${instrPhrase}.`);
  }

  // --- 3. Tempo / Rhythm -------------------------------------------------
  const tempoBits = [];
  if (bpm) tempoBits.push(`${bpm} BPM`);
  if (tempoDescriptive) tempoBits.push(tempoDescriptive.toLowerCase());
  if (tempoBits.length) {
    sentences.push(`Tempo: ${tempoBits.join(", ")}.`);
  }

  // --- 3b. Key / meter / mode -------------------------------------------
  // Prompt-level musical direction Lyria understands from natural language.
  const musicalBits = [];
  if (key) musicalBits.push(key);
  if (timeSignature) musicalBits.push(`${timeSignature} time`);
  if (mode) musicalBits.push(`the ${mode} mode`);
  if (musicalBits.length) {
    sentences.push(`In ${joinList(musicalBits)}.`);
  }

  // --- 4. Vocals / Language ---------------------------------------------
  if (instrumental) {
    sentences.push("Instrumental only, no vocals.");
    if (lyrics) {
      warnings.push(
        'Instrumental is ON but lyrics were provided — lyrics are ignored when instrumental is selected.'
      );
    }
  } else {
    // Texture reads as a list ("raspy and soulful"); range/gender reads as a
    // compound ("male baritone"), so they join differently.
    const texturePhrase = joinList(vocalTextures).toLowerCase();
    const genderPhrase = vocalGenders.map(clean).filter(Boolean).join(" ").toLowerCase();
    const vocalDescriptor = [texturePhrase, genderPhrase].filter(Boolean).join(" ");
    let vocalSentence = "";
    if (vocalDescriptor) {
      vocalSentence = `Vocals should be ${vocalDescriptor}`;
    } else if (language || lyrics) {
      vocalSentence = "With vocals";
    }
    if (vocalSentence) {
      if (language) vocalSentence += ` singing in ${language}`;
      sentences.push(vocalSentence + ".");
    }
  }

  // --- 5. Extra free-text details ---------------------------------------
  if (extra) sentences.push(extra.endsWith(".") ? extra : extra + ".");

  // --- 6. Lyrics (verbatim, per the guide) ------------------------------
  // The guide is explicit: use the literal `Lyrics:` marker, and keep any
  // [Section] / [0:00 - 0:10] tokens exactly as written by the user.
  let prompt = sentences.join(" ");
  if (!instrumental && lyrics) {
    prompt += `\n\nLyrics: ${lyrics}`;
  }

  return { prompt: prompt.trim(), warnings };
}
