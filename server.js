/**
 * server.js
 *
 * Local Express server for MusicStudio. It:
 *   - serves the static web UI from /public
 *   - exposes POST /api/build-prompt  (form data -> prompt text; no API cost)
 *   - exposes POST /api/generate      (form data -> generated audio)
 *
 * The OpenRouter API key is read from the environment and never leaves
 * the server — the browser only ever talks to this local process.
 */

import "dotenv/config";
import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPrompt } from "./src/promptBuilder.js";
import { generateMusic } from "./src/lyriaClient.js";
import { generateLyrics, DEFAULT_LYRICS_MODEL } from "./src/lyricsClient.js";
import { generateArrangement, DEFAULT_ENHANCE_MODEL } from "./src/enhanceClient.js";
import { generateTitle, extractLyrics } from "./src/nameClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const MANIFEST_PATH = path.join(DOWNLOADS_DIR, "library.json");

/* ---------- track library (manifest) ---------- */

// Reject anything but a plain filename (no path traversal, no subdirs).
function safeFilename(name) {
  return typeof name === "string" && /^[^/\\]+$/.test(name) && name !== "library.json";
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeManifest(entries) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2));
}

// Turn a string into a filesystem-safe slug.
function slugify(text, fallback = "track") {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 40) || fallback;
}

// Persist a generated track + record it in the manifest. Returns the entry.
function saveTrack(audio, promptText, meta = {}) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  const ext = audio.mimeType.includes("wav") ? "wav"
    : audio.mimeType.includes("ogg") ? "ogg" : "mp3";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = `${stamp}_${slugify(promptText)}.${ext}`;
  const bytes = Buffer.from(audio.data, "base64");
  fs.writeFileSync(path.join(DOWNLOADS_DIR, file), bytes);

  const entry = {
    file,
    name: promptText.slice(0, 60) || file,
    prompt: promptText,
    model: meta.model || "",
    format: ext,
    seed: Number.isFinite(meta.seed) ? meta.seed : null,
    createdAt: new Date().toISOString(),
    size: bytes.length,
  };
  const manifest = readManifest();
  manifest.push(entry);
  writeManifest(manifest);
  return entry;
}

// List saved tracks, newest first. Prunes manifest rows whose file is gone and
// adopts any audio files on disk that aren't in the manifest yet (e.g. tracks
// created before the manifest existed).
function listTracks() {
  let manifest = readManifest();
  manifest = manifest.filter((e) => fs.existsSync(path.join(DOWNLOADS_DIR, e.file)));

  const known = new Set(manifest.map((e) => e.file));
  let changed = manifest.length !== readManifest().length;
  for (const file of fs.existsSync(DOWNLOADS_DIR) ? fs.readdirSync(DOWNLOADS_DIR) : []) {
    if (!/\.(mp3|wav|ogg)$/i.test(file) || known.has(file)) continue;
    const stat = fs.statSync(path.join(DOWNLOADS_DIR, file));
    manifest.push({
      file,
      name: file.replace(/\.[^.]+$/, ""),
      prompt: "",
      model: "",
      format: file.split(".").pop().toLowerCase(),
      createdAt: stat.mtime.toISOString(),
      size: stat.size,
    });
    changed = true;
  }
  if (changed) writeManifest(manifest);

  // Sort by createdAt ascending, return newest first.
  return [...manifest].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).reverse();
}

const PORT = process.env.PORT || 3000;
// Bind to all interfaces by default so the app is reachable on the local
// network. Set HOST=127.0.0.1 in .env to restrict it to this machine only.
const HOST = process.env.HOST || "0.0.0.0";
const API_KEY = process.env.OPENROUTER_API_KEY;
const APP_TITLE = process.env.APP_TITLE || "MusicStudio";
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const LYRICS_MODEL = process.env.LYRICS_MODEL || DEFAULT_LYRICS_MODEL;
const ENHANCE_MODEL = process.env.ENHANCE_MODEL || DEFAULT_ENHANCE_MODEL;

const app = express();
app.use(express.json({ limit: "12mb" })); // reference images can be a few MB
app.use(express.static(path.join(__dirname, "public")));
// Serve saved tracks so the history panel can stream them by URL.
app.use("/downloads", express.static(DOWNLOADS_DIR));

// Tell the UI whether a key is configured, without ever exposing it.
app.get("/api/health", (req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(API_KEY) });
});

// OpenRouter credit balance (remaining = total purchased − total used).
app.get("/api/credits", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "No OPENROUTER_API_KEY configured." });
  try {
    const r = await fetch("https://openrouter.ai/api/v1/credits", {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: d?.error?.message || `HTTP ${r.status}` });
    const total = Number(d?.data?.total_credits) || 0;
    const used = Number(d?.data?.total_usage) || 0;
    res.json({ total, used, remaining: Math.max(0, total - used) });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Build (and preview) the prompt. Pure/free — no OpenRouter call.
app.post("/api/build-prompt", (req, res) => {
  try {
    const { prompt, warnings } = buildPrompt(req.body || {});
    res.json({ prompt, warnings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate original lyrics with the text model (Claude Sonnet by default).
app.post("/api/lyrics", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "No OPENROUTER_API_KEY configured." });
  }
  try {
    const { lyrics, model } = await generateLyrics({
      apiKey: API_KEY,
      params: req.body || {},
      model: LYRICS_MODEL,
      headers: { "HTTP-Referer": APP_URL, "X-Title": APP_TITLE },
    });
    res.json({ lyrics, model });
  } catch (err) {
    console.error("[lyrics] error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Suggest arrangement / production direction for the Extra details field,
// informed by the current style settings and lyrics.
app.post("/api/enhance", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "No OPENROUTER_API_KEY configured." });
  }
  try {
    const { details, model } = await generateArrangement({
      apiKey: API_KEY,
      params: req.body || {},
      model: ENHANCE_MODEL,
      headers: { "HTTP-Referer": APP_URL, "X-Title": APP_TITLE },
    });
    res.json({ details, model });
  } catch (err) {
    console.error("[enhance] error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Suggest a title for an already-generated track: from its lyrics if it has
// any, otherwise creatively from its style/prompt.
app.post("/api/name", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "No OPENROUTER_API_KEY configured." });
  const prompt = (req.body && req.body.prompt) || "";
  const { style, lyrics } = extractLyrics(prompt);
  if (!lyrics && !style) {
    return res.status(400).json({ error: "This track has no prompt to name it from." });
  }
  try {
    const { name } = await generateTitle({
      apiKey: API_KEY,
      lyrics,
      style,
      model: LYRICS_MODEL,
      headers: { "HTTP-Referer": APP_URL, "X-Title": APP_TITLE },
    });
    res.json({ name });
  } catch (err) {
    console.error("[name] error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Generate music. Accepts the same form data; if the client sends an
// edited `prompt`, that is used verbatim, otherwise we build one.
app.post("/api/generate", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error:
        "No OPENROUTER_API_KEY configured. Copy .env.example to .env and add your key, then restart the server.",
    });
  }

  const body = req.body || {};
  let prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  let warnings = [];
  if (!prompt) {
    const built = buildPrompt(body);
    prompt = built.prompt;
    warnings = built.warnings;
  }

  const model = body.model === "clip" ? "clip" : "pro";
  // WAV is only supported on the Pro model; fall back to mp3 otherwise.
  let format = body.format === "wav" ? "wav" : "mp3";
  if (format === "wav" && model !== "pro") {
    format = "mp3";
    warnings = [...warnings, "WAV is only available on Lyria 3 Pro — used MP3 instead."];
  }

  // Use the caller's seed if a real number was given, otherwise mint a random
  // one so every track is reproducible and its seed can be recorded. (An empty
  // string must count as "not given" — Number("") is 0, which we must ignore.)
  const rawSeed = body.seed;
  const providedSeed = rawSeed === "" || rawSeed == null ? NaN : Number(rawSeed);
  const seed = Number.isInteger(providedSeed) && providedSeed >= 0
    ? providedSeed
    : Math.floor(Math.random() * 2_147_483_647);

  // Optional reference image (data URL) to steer the vibe.
  const image = typeof body.image === "string" && body.image.startsWith("data:image")
    ? body.image
    : undefined;

  try {
    const { audio } = await generateMusic({
      prompt,
      apiKey: API_KEY,
      model,
      format,
      seed,
      image,
      headers: { "HTTP-Referer": APP_URL, "X-Title": APP_TITLE },
    });

    // Normalise to a data URL the browser can play directly.
    const src =
      audio.kind === "base64"
        ? `data:${audio.mimeType};base64,${audio.data}`
        : audio.data;

    // Persist a copy to downloads/ (best-effort — don't fail the request if
    // saving hits a filesystem issue).
    let savedFile = null;
    if (audio.kind === "base64") {
      try {
        const entry = saveTrack(audio, prompt, { model, seed });
        savedFile = entry.file;
        console.log(`[generate] saved ${savedFile} (seed ${seed})`);
      } catch (saveErr) {
        console.error("[generate] could not save track:", saveErr.message);
      }
    }

    res.json({ prompt, warnings, audioSrc: src, mimeType: audio.mimeType, savedFile, seed });
  } catch (err) {
    console.error("[generate] error:", err.message);
    if (err.raw) console.error("[generate] raw response:", err.raw);
    res.status(502).json({ error: err.message, raw: err.raw, blocked: Boolean(err.blocked) });
  }
});

/* ---------- track library endpoints ---------- */

// List saved tracks (newest first).
app.get("/api/tracks", (req, res) => {
  res.json({ tracks: listTracks() });
});

// Rename a track — updates the display name and the file on disk.
app.post("/api/tracks/rename", (req, res) => {
  const { file, name } = req.body || {};
  if (!safeFilename(file)) return res.status(400).json({ error: "Invalid file." });
  const trimmed = (name || "").trim();
  if (!trimmed) return res.status(400).json({ error: "Name cannot be empty." });

  const manifest = readManifest();
  const entry = manifest.find((e) => e.file === file);
  if (!entry) return res.status(404).json({ error: "Track not found." });

  const oldPath = path.join(DOWNLOADS_DIR, file);
  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: "File missing on disk." });

  // Rename the file on disk to match, keeping the extension unique.
  const ext = path.extname(file);
  const stamp = file.split("_")[0]; // preserve original timestamp prefix
  let newFile = `${stamp}_${slugify(trimmed)}${ext}`;
  if (newFile !== file && fs.existsSync(path.join(DOWNLOADS_DIR, newFile))) {
    newFile = `${stamp}_${slugify(trimmed)}-${Date.now().toString(36)}${ext}`;
  }
  try {
    if (newFile !== file) fs.renameSync(oldPath, path.join(DOWNLOADS_DIR, newFile));
  } catch (e) {
    return res.status(500).json({ error: "Could not rename file: " + e.message });
  }
  entry.file = newFile;
  entry.name = trimmed;
  writeManifest(manifest);
  res.json({ ok: true, track: entry });
});

// Delete a track (file + manifest entry).
app.delete("/api/tracks", (req, res) => {
  const { file } = req.body || {};
  if (!safeFilename(file)) return res.status(400).json({ error: "Invalid file." });

  const manifest = readManifest();
  const next = manifest.filter((e) => e.file !== file);
  try {
    const p = path.join(DOWNLOADS_DIR, file);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    return res.status(500).json({ error: "Could not delete file: " + e.message });
  }
  writeManifest(next);
  res.json({ ok: true });
});

// Collect this machine's non-internal IPv4 addresses (for LAN access).
function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === "IPv4" && !net.internal) out.push(net.address);
    }
  }
  return out;
}

app.listen(PORT, HOST, () => {
  console.log("\n  🎵 Music Studio running:");
  console.log(`     Local:    http://localhost:${PORT}`);
  if (HOST !== "127.0.0.1") {
    for (const ip of lanAddresses()) {
      console.log(`     Network:  http://${ip}:${PORT}`);
    }
  }
  if (!API_KEY) {
    console.log(
      "\n  ⚠️  No OPENROUTER_API_KEY found — copy .env.example to .env and add your key.\n"
    );
  } else {
    console.log("\n  ✅ OpenRouter API key loaded.\n");
  }
});
