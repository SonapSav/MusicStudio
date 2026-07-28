/* app.js — MusicStudio front-end logic */

const GENRE_OPTIONS = [
  "Rock", "Pop", "Jazz", "Hip-hop", "R&B", "Afrobeats", "K-pop", "Bossa Nova",
  "Chiptune (8-bit)", "Modern Bollywood", "Funk", "Trap", "Cinematic Orchestral",
  "Lofi hip-hop", "Synthwave", "Skate punk",
  // Electronic & dance
  "House", "Techno", "Trance", "Drum & Bass", "Dubstep", "Ambient", "Disco", "UK Garage",
  // Latin & Caribbean
  "Salsa", "Cumbia", "Flamenco", "Tango", "Reggae", "Reggaeton", "Ska", "Dancehall",
  // Roots & heavy
  "Country", "Bluegrass", "Folk", "Blues", "Metal", "Grunge", "Post-rock",
  // Soul & classical
  "Soul", "Gospel", "Motown", "Classical", "Baroque", "Opera",
];
// Experimental — Greek styles Lyria may only approximate.
const GENRE_EXPERIMENTAL = [
  "Rebetiko", "Laiko", "Entechno", "Greek Folk (Dimotiko)",
  "Greek Insular (Aegean Islands)", "Cretan", "Pontic", "Zeibekiko",
];

const ERA_OPTIONS = [
  "1920s", "1930s", "1940s", "1950s", "1960s", "1970s",
  "1980s", "1990s", "2000s", "2010s", "2020s",
];

const ATMOSPHERE_OPTIONS = [
  "cinematic", "ethereal", "dreamy", "nostalgic", "hazy", "smoky", "neon-lit",
  "late-night", "rainy", "foggy", "sunlit", "warm", "cold", "icy", "cozy",
  "intimate", "spacious", "vast", "epic", "anthemic", "triumphant", "melancholic",
  "somber", "tense", "suspenseful", "mysterious", "ominous", "eerie", "haunting",
  "gritty", "raw", "lush", "minimal", "sparse", "psychedelic", "hypnotic",
  "meditative", "serene", "uplifting", "euphoric", "romantic", "sensual",
  "playful", "whimsical", "futuristic", "cosmic", "underwater", "industrial",
  "urban", "pastoral", "wintry", "tropical", "desert", "dystopian", "retro",
  "vintage", "lo-fi", "cavernous", "sacred", "ceremonial",
];

const MOOD_OPTIONS = [
  "nostalgic", "aggressive", "ethereal", "dreamy", "tense", "suspenseful",
  "energetic", "confident", "hopeful", "uplifting", "intimate", "warm",
  "dark", "haunting",
];

// Instrumentation, grouped into the guide's categories.
const KEYBOARD_OPTIONS = [
  "Fender Rhodes piano", "80s synth", "Hammond B3 organ", "dusty jazz piano",
  "grand piano", "upright piano", "Wurlitzer", "Moog synth", "analog synth pad",
  "arpeggiated synth", "Mellotron", "harpsichord", "clavinet", "celesta",
  "accordion", "church organ",
];

const DRUM_OPTIONS = [
  "TR-808", "heavy 808 bass", "slow boom-bap drums", "muffled drum break",
  "TR-909", "acoustic drum kit", "punchy kick", "crisp hi-hats", "trap hi-hats",
  "breakbeat", "four-on-the-floor kick", "rimshot", "hand claps", "congas",
  "bongos", "tambourine", "shaker", "djembe", "timpani", "marching snare",
];
const DRUM_EXPERIMENTAL = ["toumbeleki", "defi (frame drum)"];

const MALLET_OPTIONS = [
  "marimba", "vibraphone", "xylophone", "glockenspiel", "kalimba",
  "steel drums", "handpan", "tubular bells", "music box", "crotales",
];

const STRING_OPTIONS = [
  "acoustic nylon-string guitar", "electric guitar", "distorted electric guitar",
  "fingerpicked acoustic guitar", "twangy surf guitar", "funky wah guitar",
  "jazzy upright bass", "slap bass", "fretless bass", "double bass",
  "classical violins", "cello", "lush string section", "pizzicato strings",
  "harp", "banjo", "mandolin", "sitar", "lap steel guitar",
];
// Experimental — Greek string instruments Lyria may only approximate.
const STRING_EXPERIMENTAL = [
  "bouzouki", "baglamas", "tzouras", "laouto", "Cretan lyra",
  "politiki lyra", "santouri",
];

const WIND_OPTIONS = [
  "saxophone", "tenor sax", "alto sax", "baritone sax", "soprano sax",
  "trumpet", "muted trumpet", "trombone", "French horn", "tuba",
  "brass section", "flugelhorn", "cornet",
  "clarinet", "flute", "oboe", "bassoon", "piccolo", "pan flute", "harmonica",
];
// Experimental — Greek folk winds Lyria may only approximate.
const WIND_EXPERIMENTAL = ["floghera", "zournas", "gaida", "tsampouna"];

const TEXTURE_FX_OPTIONS = [
  "vinyl crackle", "retro 8-bit sounds", "tape hiss", "white noise sweep",
  "ambient pad", "reverse reverb", "sidechain pumping", "bitcrushed textures",
  "lo-fi wobble", "field recording", "rain sounds", "crowd ambience",
  "radio static", "granular textures",
];

const VOCAL_GENDER_OPTIONS = [
  "male", "female", "baritone", "tenor", "bass", "countertenor",
  "soprano", "mezzo-soprano", "alto", "contralto", "androgynous",
  "vocal duet", "choir", "full gospel choir", "children's choir",
];

const VOCAL_TEXTURE_OPTIONS = [
  "gravelly", "soulful", "breathy", "raspy", "smooth", "commanding",
  "polished", "husky", "airy", "warm", "bright", "nasal", "whispered",
  "belting", "falsetto", "operatic", "spoken-word", "autotuned", "distorted",
];
// Experimental — Greek-derived vocal styles Lyria may only approximate.
const VOCAL_TEXTURE_EXPERIMENTAL = ["melismatic", "amanes-style ornamented"];

// Guide-listed languages plus Greek (user-verified to work well). The custom
// field still allows any other language.
const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "German", "Hindi",
  "Japanese", "Korean", "Portuguese", "Greek",
];

/* ---------- icons (inline SVG, Lucide set) ---------- */
// Single source of truth for UI icons — inline SVG so there's no CDN/offline
// dependency and they inherit `currentColor` + size from CSS.
const ICONS = {
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  play: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  dice: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
};

function icon(name, size = 16) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

// Replace any <span data-icon="name"> in static markup with its SVG.
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const size = el.dataset.iconSize ? Number(el.dataset.iconSize) : 16;
    el.innerHTML = icon(el.dataset.icon, size);
    el.removeAttribute("data-icon");
  });
}

// Build "icon + message" HTML for a status line. Text is escaped.
function withIcon(name, text) {
  return `${icon(name)}<span>${escapeHtml(text)}</span>`;
}

/* ---------- element refs ---------- */
const $ = (id) => document.getElementById(id);
const form = $("musicForm");
const promptBox = $("promptBox");
const warningsEl = $("warnings");
const statusEl = $("status");
const playerEl = $("player");
const audioEl = $("audio");
const downloadLink = $("downloadLink");
const rawBox = $("rawBox");
const rawPre = $("rawPre");
const generateBtn = $("generateBtn");
const previewBtn = $("previewBtn");
const instrumentalCb = $("instrumental");
const vocalOptions = $("vocalOptions");

/* ---------- build chip groups ---------- */
// maxSelect: 0 (or omitted) = unlimited. When the cap is reached, remaining
// unselected chips are dimmed and can't be activated until one is freed.
// experimental: optional array rendered below an "Experimental" divider in the
// same container (so selection + cap logic still treat them as one group).
function buildChips(containerId, options, maxSelect = 0, experimental = null) {
  const container = $(containerId);

  const makeChip = (opt, isExp) => {
    const chip = document.createElement("span");
    chip.className = isExp ? "chip exp" : "chip";
    chip.textContent = opt;
    chip.dataset.value = opt;
    chip.addEventListener("click", () => {
      // Single-select (maxSelect === 1) behaves like a radio: clicking a chip
      // clears the others; clicking the active one clears it.
      if (maxSelect === 1) {
        const wasActive = chip.classList.contains("active");
        container.querySelectorAll(".chip.active").forEach((c) => c.classList.remove("active"));
        if (!wasActive) chip.classList.add("active");
        return;
      }
      const active = container.querySelectorAll(".chip.active").length;
      if (!chip.classList.contains("active") && maxSelect && active >= maxSelect) return;
      chip.classList.toggle("active");
      if (maxSelect) enforceCap(container, maxSelect);
    });
    container.appendChild(chip);
  };

  options.forEach((opt) => makeChip(opt, false));

  if (experimental && experimental.length) {
    const divider = document.createElement("div");
    divider.className = "chip-divider";
    divider.innerHTML =
      '<span class="chip-divider-label">Experimental' +
      '<span class="exp-note"> · Lyria may only approximate these</span></span><hr>';
    container.appendChild(divider);
    experimental.forEach((opt) => makeChip(opt, true));
  }
}

// Dim (visually disable) unselected chips once the cap is hit.
function enforceCap(container, maxSelect) {
  const atCap = container.querySelectorAll(".chip.active").length >= maxSelect;
  container.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("disabled", atCap && !c.classList.contains("active"));
  });
}

buildChips("genres", GENRE_OPTIONS, 2, GENRE_EXPERIMENTAL);
buildChips("eras", ERA_OPTIONS, 1);
buildChips("moods", MOOD_OPTIONS);
buildChips("atmospheres", ATMOSPHERE_OPTIONS);
buildChips("instrKeys", KEYBOARD_OPTIONS);
buildChips("instrDrums", DRUM_OPTIONS, 0, DRUM_EXPERIMENTAL);
buildChips("instrMallets", MALLET_OPTIONS);
buildChips("instrStrings", STRING_OPTIONS, 0, STRING_EXPERIMENTAL);
buildChips("instrWinds", WIND_OPTIONS, 0, WIND_EXPERIMENTAL);
buildChips("instrTexture", TEXTURE_FX_OPTIONS);
buildChips("vocalGenders", VOCAL_GENDER_OPTIONS);
buildChips("vocalTextures", VOCAL_TEXTURE_OPTIONS, 0, VOCAL_TEXTURE_EXPERIMENTAL);
buildChips("languages", LANGUAGE_OPTIONS, 1);

function selectedChips(containerId) {
  return [...$(containerId).querySelectorAll(".chip.active")].map((c) => c.dataset.value);
}

// Split a comma-separated custom input into trimmed, non-empty values.
function customValues(inputId) {
  return ($(inputId).value || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// Multi-select group: selected pills + custom text, as an array.
function pickList(chipId, customId) {
  return [...selectedChips(chipId), ...customValues(customId)];
}

// Several multi-select groups combined + one shared custom field, as an array.
function pickGroups(chipIds, customId) {
  return [...chipIds.flatMap(selectedChips), ...customValues(customId)];
}

// Single-select group: the one selected pill, or the custom text, as a string.
function pickOne(chipId, customId) {
  return [selectedChips(chipId)[0] || "", ...customValues(customId)]
    .filter(Boolean)
    .join(" ");
}

/* ---------- vocals toggle ---------- */
function syncVocalState() {
  const off = instrumentalCb.checked;
  vocalOptions.style.opacity = off ? "0.4" : "1";
  vocalOptions.style.pointerEvents = off ? "none" : "auto";
}
instrumentalCb.addEventListener("change", syncVocalState);
syncVocalState();

/* ---------- format follows the chosen model ---------- */
// Pro defaults to lossless WAV (overridable); Clip is MP3-only.
function syncFormat() {
  const isClip = $("model").value === "clip";
  const format = $("format");
  const wavOpt = format.querySelector('option[value="wav"]');

  wavOpt.disabled = isClip;   // can't be picked for Clip
  wavOpt.hidden = isClip;     // and hidden from the dropdown
  format.value = isClip ? "mp3" : "wav"; // Clip→MP3, Pro→WAV default
}
$("model").addEventListener("change", syncFormat);
syncFormat();

/* ---------- estimated cost band (per model) ---------- */
// Lyria is a flat per-generation charge (Clip ~$0.04, Pro ~$0.08); the AI
// lyrics/arrangement helpers add ~$0.01 each, pushing toward the top of each band.
function syncCost() {
  const band = $("model").value === "clip" ? "$0.04 – $0.06" : "$0.08 – $0.10";
  $("costEstimate").textContent = `≈ ${band}`;
}
$("model").addEventListener("change", syncCost);
syncCost();

/* ---------- seed ---------- */
$("seedRandom").addEventListener("click", () => {
  $("seed").value = Math.floor(Math.random() * 2147483647);
});

/* ---------- reference image ---------- */
let referenceImage = null; // data URL, or null
const imageInput = $("imageInput");
$("imagePick").addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    alert("That image is over 8 MB — please choose a smaller one.");
    imageInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    referenceImage = reader.result;
    $("imageThumb").src = referenceImage;
    $("imagePlaceholder").hidden = true;
    $("imagePreview").hidden = false;
  };
  reader.readAsDataURL(file);
});
$("imageClear").addEventListener("click", () => {
  referenceImage = null;
  imageInput.value = "";
  $("imageThumb").removeAttribute("src");
  $("imagePreview").hidden = true;
  $("imagePlaceholder").hidden = false;
});

/* ---------- collect form data ---------- */
function collectData() {
  // Genre: up to 2 selected pills, blended with "and", plus any custom text.
  const genre = [
    selectedChips("genres").join(" and "),
    ($("genreCustom").value || "").trim(),
  ].filter(Boolean).join(" ");

  return {
    model: $("model").value,
    format: $("format").value,
    genre,
    era: pickOne("eras", "eraCustom"),
    moods: pickList("moods", "moodCustom"),
    atmosphere: pickList("atmospheres", "atmosphereCustom"),
    instrumentation: pickGroups(
      ["instrKeys", "instrDrums", "instrMallets", "instrStrings", "instrWinds", "instrTexture"],
      "instrCustom"
    ),
    bpm: $("bpm").value,
    tempoDescriptive: $("tempoDescriptive").value,
    key: $("key").value,
    timeSignature: $("timeSignature").value,
    mode: $("mode").value,
    seed: $("seed").value.trim(),
    instrumental: instrumentalCb.checked,
    vocalGender: pickList("vocalGenders", "vocalGenderCustom"),
    vocalTexture: pickList("vocalTextures", "vocalTextureCustom"),
    language: pickOne("languages", "languageCustom"),
    lyrics: $("lyrics").value,
    extraDetails: $("extraDetails").value,
  };
}

/* ---------- helpers ---------- */
function showStatus(kind, html) {
  statusEl.hidden = false;
  statusEl.className = `status ${kind}`;
  statusEl.innerHTML = html;
}
function clearStatus() {
  statusEl.hidden = true;
  statusEl.innerHTML = "";
}

// Scroll a result element into view (used now that the prompt/player sit below
// the form). Respects reduced-motion.
function reveal(el) {
  if (!el) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  el.scrollIntoView({ behavior, block: "start" });
}
function renderWarnings(warnings = []) {
  warningsEl.innerHTML = "";
  for (const w of warnings) {
    const div = document.createElement("div");
    div.className = "warn-item";
    div.innerHTML = withIcon("alertTriangle", w);
    warningsEl.appendChild(div);
  }
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { raw: data.raw, blocked: data.blocked });
  return data;
}

/* ---------- preview prompt ---------- */
previewBtn.addEventListener("click", async () => {
  try {
    const { prompt, warnings } = await postJSON("/api/build-prompt", collectData());
    promptBox.value = prompt;
    renderWarnings(warnings);
    clearStatus();
    reveal(document.querySelector(".result"));
  } catch (err) {
    showStatus("error", withIcon("alertTriangle", "Could not build prompt: " + err.message));
  }
});

/* ---------- generate ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // If the prompt box has been edited/filled, send it verbatim.
  const edited = promptBox.value.trim();
  const payload = collectData();
  if (edited) payload.prompt = edited;
  if (referenceImage) payload.image = referenceImage;

  generateBtn.disabled = true;
  previewBtn.disabled = true;
  playerEl.hidden = true;
  rawBox.hidden = true;
  renderWarnings([]);
  showStatus("loading", '<span class="spinner"></span>Generating music… this can take 15–60s.');

  try {
    const data = await postJSON("/api/generate", payload);
    promptBox.value = data.prompt || edited;
    renderWarnings(data.warnings || []);

    audioEl.src = data.audioSrc;
    downloadLink.href = data.audioSrc;
    downloadLink.download = suggestFilename(payload, data.mimeType);
    playerEl.hidden = false;
    if (data.savedFile) {
      const seedNote = data.seed != null ? ` · seed ${data.seed}` : "";
      showStatus("saved", withIcon("checkCircle", `Saved to downloads/${data.savedFile}${seedNote}`));
    } else {
      clearStatus();
    }
    audioEl.play().catch(() => {/* autoplay may be blocked; that's fine */});
    reveal(playerEl);
    loadTracks(true); // refresh library and jump to page 1 to show the new track
    refreshCredits();
  } catch (err) {
    let msg = err.message;
    // If a content block coincided with explicit lyrics, point at the toggle.
    if (err.blocked && $("lyricExplicit").checked && $("lyrics").value.trim()) {
      msg += " Tip: “Allow explicit language” is on — try switching it off and regenerating.";
    }
    showStatus("error", withIcon("alertTriangle", msg));
    if (err.raw) {
      rawBox.hidden = false;
      rawPre.textContent = typeof err.raw === "string" ? err.raw : JSON.stringify(err.raw, null, 2);
    }
  } finally {
    generateBtn.disabled = false;
    previewBtn.disabled = false;
  }
});

function suggestFilename(data, mimeType) {
  const ext = (mimeType || "").includes("wav") ? "wav"
    : (mimeType || "").includes("ogg") ? "ogg" : "mp3";
  const base = [data.genre, data.era].map((s) => (s || "").trim()).filter(Boolean).join("-")
    || "track";
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `musicstudio-${slug}.${ext}`;
}

/* ---------- AI lyric generation ---------- */
const genLyricsBtn = $("genLyricsBtn");
const lyricStatus = $("lyricStatus");

genLyricsBtn.addEventListener("click", async () => {
  const form = collectData(); // reuse the assembled genre / moods / language
  const params = {
    theme: $("lyricTheme").value.trim(),
    story: $("lyricStory").value.trim(),
    moods: form.moods,
    genre: form.genre,
    language: form.language,
    structure: $("lyricStructure").value,
    rhyme: $("lyricRhyme").value,
    explicit: $("lyricExplicit").checked,
  };

  genLyricsBtn.disabled = true;
  lyricStatus.className = "lyric-status loading";
  lyricStatus.textContent = "Writing lyrics…";
  try {
    const res = await fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    $("lyrics").value = data.lyrics;
    lyricStatus.className = "lyric-status success";
    lyricStatus.innerHTML = withIcon("checkCircle", "Lyrics ready — edit freely, then generate music.");
    refreshCredits();
  } catch (err) {
    lyricStatus.className = "lyric-status error";
    lyricStatus.innerHTML = withIcon("alertTriangle", err.message);
  } finally {
    genLyricsBtn.disabled = false;
  }
});

/* ---------- AI arrangement suggestion (Extra details) ---------- */
const suggestArrBtn = $("suggestArrBtn");
const arrStatus = $("arrStatus");

suggestArrBtn.addEventListener("click", async () => {
  const payload = collectData(); // full style context + lyrics + model
  suggestArrBtn.disabled = true;
  arrStatus.className = "lyric-status loading";
  arrStatus.textContent = "Designing the arrangement…";
  try {
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    $("extraDetails").value = data.details;
    arrStatus.className = "lyric-status success";
    arrStatus.innerHTML = withIcon("checkCircle", "Arrangement drafted — tweak it, then generate.");
    refreshCredits();
  } catch (err) {
    arrStatus.className = "lyric-status error";
    arrStatus.innerHTML = withIcon("alertTriangle", err.message);
  } finally {
    suggestArrBtn.disabled = false;
  }
});

/* ---------- library / history ---------- */
const trackListEl = $("trackList");
const trackCountEl = $("trackCount");
const paginationEl = $("pagination");
const pageSizeSel = $("pageSize");
const sortBySel = $("sortBy");

let allTracks = [];      // full list from the server (newest first)
let currentPage = 1;     // 1-based
let pageSize = 5;        // rows per page
let sortMode = "newest"; // newest | oldest | name-asc | name-desc | largest | smallest

// Return a sorted copy of the track list according to the current sort mode.
function sortTracks(list) {
  const a = [...list];
  const byDate = (x, y) => (x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : 0);
  const byName = (x, y) => (x.name || "").localeCompare(y.name || "", undefined, { sensitivity: "base" });
  switch (sortMode) {
    case "oldest": a.sort(byDate); break;
    case "name-asc": a.sort(byName); break;
    case "name-desc": a.sort((x, y) => byName(y, x)); break;
    case "largest": a.sort((x, y) => (y.size || 0) - (x.size || 0)); break;
    case "smallest": a.sort((x, y) => (x.size || 0) - (y.size || 0)); break;
    case "newest":
    default: a.sort((x, y) => byDate(y, x)); break;
  }
  return a;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtSize(bytes) {
  if (!bytes) return "";
  return bytes > 1e6 ? (bytes / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return ""; }
}
// True if a built prompt contains a non-empty Lyrics section.
function hasLyrics(prompt) {
  if (!prompt) return false;
  const idx = prompt.search(/\n?\s*Lyrics:\s*/i);
  if (idx === -1) return false;
  return prompt.slice(idx).replace(/^\n?\s*Lyrics:\s*/i, "").trim().length > 0;
}

function fmtDuration(sec) {
  if (!isFinite(sec) || sec <= 0) return "";
  let m = Math.floor(sec / 60);
  let s = Math.round(sec % 60);
  if (s === 60) { m += 1; s = 0; } // roll over when rounding hits 60
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function loadTracks(resetPage = false) {
  try {
    const res = await fetch("/api/tracks");
    const { tracks } = await res.json();
    allTracks = tracks || [];
  } catch { return; /* server offline — leave as-is */ }
  if (resetPage) currentPage = 1;
  renderLibrary();
}

// Decide which slice of tracks is visible, then render rows + pagination.
function renderLibrary() {
  const sorted = sortTracks(allTracks);
  const total = sorted.length;
  trackCountEl.textContent = total ? `(${total})` : "";

  if (!total) {
    trackListEl.innerHTML = '<p class="empty">No tracks yet — generate one above.</p>';
    paginationEl.hidden = true;
    paginationEl.innerHTML = "";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages); // clamp

  const start = (currentPage - 1) * pageSize;
  renderRows(sorted.slice(start, start + pageSize));
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationEl.hidden = true;
    paginationEl.innerHTML = "";
    return;
  }
  paginationEl.hidden = false;
  paginationEl.innerHTML =
    `<button class="btn ghost small" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>` +
      `${icon("chevronLeft")} Prev</button>` +
    `<span class="page-info">Page ${currentPage} of ${totalPages}</span>` +
    `<button class="btn ghost small" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>` +
      `Next ${icon("chevronRight")}</button>`;

  paginationEl.querySelector('[data-page="prev"]').addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderLibrary(); }
  });
  paginationEl.querySelector('[data-page="next"]').addEventListener("click", () => {
    if (currentPage < totalPages) { currentPage++; renderLibrary(); }
  });
}

function renderRows(tracks) {
  trackListEl.innerHTML = "";
  for (const t of tracks) {
    const url = `/downloads/${encodeURIComponent(t.file)}`;
    const meta = [
      t.model && t.model.toUpperCase(),
      (t.format || "").toUpperCase(),
      fmtSize(t.size),
      fmtDate(t.createdAt),
      t.seed != null ? `seed ${t.seed}` : "",
    ].filter(Boolean).join(" · ");

    const promptHtml = t.prompt
      ? escapeHtml(t.prompt)
      : '<span class="muted">(prompt not recorded for this track)</span>';

    const canName = Boolean(t.prompt);
    const nameTitle = !canName
      ? "No prompt to name from — rename manually"
      : hasLyrics(t.prompt) ? "Auto-name from the lyrics" : "Auto-name from the style";

    const row = document.createElement("div");
    row.className = "track";
    row.innerHTML = `
      <div class="track-head">
        <div class="track-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>
        <div class="track-meta">${escapeHtml(meta)}<span class="dur"></span></div>
      </div>
      <details class="track-prompt">
        <summary>Prompt used</summary>
        <div class="track-prompt-body">${promptHtml}</div>
      </details>
      <div class="track-playrow">
        <audio controls preload="metadata" src="${url}"></audio>
        <div class="track-actions">
          <a class="btn ghost small icon-btn" href="${url}" download title="Download" aria-label="Download">${icon("download")}</a>
          <button class="btn ghost small icon-btn" data-act="vary" title="Generate a variation (new seed)" aria-label="Generate variation">${icon("dice")}</button>
          <button class="btn ghost small icon-btn" data-act="name" ${canName ? "" : "disabled"}
            title="${nameTitle}" aria-label="Auto-name">${icon("sparkles")}</button>
          <button class="btn ghost small icon-btn" data-act="rename" title="Rename" aria-label="Rename">${icon("pencil")}</button>
          <button class="btn ghost small icon-btn danger" data-act="delete" title="Delete" aria-label="Delete">${icon("trash")}</button>
        </div>
      </div>`;

    // Duration is read from the audio metadata once the browser loads it.
    const audio = row.querySelector("audio");
    const durEl = row.querySelector(".dur");
    audio.addEventListener("loadedmetadata", () => {
      const d = fmtDuration(audio.duration);
      if (d) durEl.textContent = " · " + d;
    });

    row.querySelector('[data-act="vary"]').addEventListener("click", () => varyTrack(t));
    row.querySelector('[data-act="name"]').addEventListener("click", () => nameTrack(t));
    row.querySelector('[data-act="rename"]').addEventListener("click", () => startInlineRename(row, t));
    row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteTrack(t));
    trackListEl.appendChild(row);
  }
}

// Inline rename: turn the track name into an editable field in place.
// Enter or blur commits; Escape cancels. Either way we reload to re-render.
function startInlineRename(row, t) {
  const nameEl = row.querySelector(".track-name");
  if (!nameEl || row.querySelector(".rename-input")) return; // already editing

  const input = document.createElement("input");
  input.className = "rename-input";
  input.type = "text";
  input.value = t.name;
  input.setAttribute("aria-label", "Rename track");
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;
  const finish = async (commit) => {
    if (done) return;
    done = true;
    const newName = input.value.trim();
    if (commit && newName && newName !== t.name) {
      try {
        await postJSON("/api/tracks/rename", { file: t.file, name: newName });
      } catch (err) {
        alert("Rename failed: " + err.message);
      }
    }
    loadTracks(); // re-render the list (restores original name on cancel)
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
  });
  input.addEventListener("blur", () => finish(true));
}

// Regenerate from a track's stored prompt with a fresh random seed.
async function varyTrack(t) {
  if (!t.prompt) {
    alert("This track has no stored prompt, so it can't be varied.");
    return;
  }
  const cost = t.model === "clip" ? "~$0.04" : "~$0.08";
  if (!window.confirm(`Generate a variation of "${t.name}" with a new random seed?\n\nThis runs a fresh ${(t.model || "pro").toUpperCase()} generation (${cost}).`)) return;

  showStatus("loading", '<span class="spinner"></span>Generating a variation… this can take 15–60s.');
  try {
    const data = await postJSON("/api/generate", {
      prompt: t.prompt,
      model: t.model || "pro",
      format: t.format || "mp3",
      // no seed → the server mints a fresh random one
    });
    showStatus("saved", withIcon("checkCircle", `Variation saved · seed ${data.seed}`));
    loadTracks(true);
    refreshCredits();
  } catch (err) {
    showStatus("error", withIcon("alertTriangle", err.message));
  }
}

// Ask the model for a title based on the track's lyrics, then apply it.
async function nameTrack(t) {
  if (!t.prompt) return; // button is disabled in this case anyway
  const from = hasLyrics(t.prompt) ? "lyrics" : "style";
  showStatus("loading", `<span class="spinner"></span>Naming the track from its ${from}…`);
  try {
    const { name } = await postJSON("/api/name", { prompt: t.prompt });
    await postJSON("/api/tracks/rename", { file: t.file, name });
    showStatus("saved", withIcon("checkCircle", `Named “${name}”`));
    loadTracks();
    refreshCredits();
  } catch (err) {
    showStatus("error", withIcon("alertTriangle", err.message));
  }
}

async function deleteTrack(t) {
  if (!window.confirm(`Delete "${t.name}"? This permanently removes the file.`)) return;
  try {
    const res = await fetch("/api/tracks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: t.file }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${res.status}`);
    }
    loadTracks();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

$("refreshTracks").addEventListener("click", () => loadTracks());
pageSizeSel.addEventListener("change", () => {
  pageSize = Number(pageSizeSel.value) || 5;
  currentPage = 1;
  renderLibrary();
});
sortBySel.addEventListener("change", () => {
  sortMode = sortBySel.value;
  currentPage = 1;
  renderLibrary();
});
hydrateIcons();
loadTracks();

/* ---------- credit balance ---------- */
async function refreshCredits() {
  const el = $("creditBalance");
  try {
    const res = await fetch("/api/credits");
    const d = await res.json();
    if (!res.ok || typeof d.remaining !== "number") throw new Error(d.error || "unavailable");
    el.textContent = "$" + d.remaining.toFixed(2);
    el.className = "balance-pill" + (d.remaining < 0.2 ? " critical" : d.remaining < 1 ? " low" : "");
    el.hidden = false;
  } catch {
    el.hidden = true; // hide if the balance can't be fetched
  }
}
refreshCredits();

/* ---------- health / key status ---------- */
(async function checkHealth() {
  const el = $("keyStatus");
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.hasApiKey) {
      el.textContent = "API key ✓";
      el.className = "key-status ok";
    } else {
      el.textContent = "No API key — see README";
      el.className = "key-status bad";
    }
  } catch {
    el.textContent = "server offline";
    el.className = "key-status bad";
  }
})();
