<!-- Replace the placeholder images with your own screenshots when ready. -->
<p align="center">
  <img src="https://placehold.co/1200x480/0d0e12/e8a24a?text=Music+Studio" alt="Music Studio" width="100%" />
</p>

<h1 align="center">🎵 Music Studio</h1>

<p align="center">
  A self-hosted web app for generating music with <b>Google Lyria&nbsp;3</b> — with AI-written
  lyrics, AI arrangement, and reference-image conditioning — all driven from one clean console.
</p>

<p align="center">
  <img alt="Node.js ≥ 18" src="https://img.shields.io/badge/Node.js-%E2%89%A518-5FA04E?logo=node.js&logoColor=white" />
  <img alt="Music: Lyria 3" src="https://img.shields.io/badge/music-Lyria%203-e8a24a" />
  <img alt="Lyrics: Claude" src="https://img.shields.io/badge/lyrics%20%26%20arrangement-Claude-4fc8bd" />
  <img alt="Self-hosted" src="https://img.shields.io/badge/self--hosted-local-999" />
</p>

---

You run Music Studio on your own machine. It gives you a rich, pill-driven interface to describe
a track — genre, era, mood, instruments, vocals, key, tempo — assembles a prompt following Lyria's
own prompting framework, generates the audio, then plays, saves, and organizes it in a built-in
library. It also uses **Claude** to write original lyrics and timestamped production arrangements
for you.

Everything talks to the [OpenRouter](https://openrouter.ai) API. Your API key stays on **your**
server (in a git-ignored `.env`) and never reaches the browser.

<p align="center">
  <img src="https://placehold.co/1200x700/0d0e12/9aa0b0?text=App+Screenshot+%E2%80%94+Prompt+Builder" alt="Prompt builder screenshot" width="100%" />
</p>

## ✨ Features

- **Rich prompt builder** — pick from pills for **Genre/Style**, **Era**, **Mood**, **Atmosphere**,
  **Tempo**, and **Key / Time signature / Mode**. Every field also accepts your own free text.
- **Categorized instruments** — Keyboards, Drums/Percussion, Mallets/Tuned percussion,
  Strings/Guitars, Brass & Woodwinds, and Texture/FX.
- **Vocals** — range/gender, texture, language, or fully instrumental.
- **✨ AI lyrics (Claude)** — give a theme and get original, structured lyrics
  (`[Verse]`/`[Chorus]`/`[Bridge]`) in the language of your choice.
- **🪄 AI arrangement (Claude)** — turns your style + lyrics into concise, **timestamped**
  production direction that sharpens what Lyria generates.
- **🖼️ Reference image** — attach an image to steer the vibe, genre, and lyric direction.
- **🎲 Seed & variations** — reproduce a result exactly, or spin a fresh variation of any track.
- **📚 Library** — every track is saved and listed with its prompt, duration, and seed. Play,
  download, rename inline, delete, **auto-name from the lyrics/style**, sort, and paginate.
- **🎧 Output** — Lyria 3 **Pro** (full song, up to ~3 min) or **Clip** (exactly 30s); MP3 or
  lossless WAV (Pro).
- **💸 Cost awareness** — a per-model cost estimate and a **live OpenRouter credit balance** in the
  header (turns amber/red when low).
- **🌍 Greek music pack** — experimental genres (Rebetiko, Laïko, Cretan, …), instruments
  (bouzouki, baglamas, lyra, …), meters (7/8, 9/8) and *dromoi* (Hijaz, Rast, …), clearly marked
  as experimental.
- **🖥️ Runs on your LAN too** — reach it from a phone or another computer on the same network.

<p align="center">
  <img src="https://placehold.co/1200x700/0d0e12/9aa0b0?text=App+Screenshot+%E2%80%94+Library" alt="Library screenshot" width="100%" />
</p>

## 🧩 How it works

```
Browser UI  ──fetch──►  Local Node/Express server  ──►  OpenRouter  ──►  Lyria 3 (music)
(prompt builder,        (holds the API key,                           └►  Claude (lyrics,
 player, library)        builds prompts, saves audio)                     arrangement, naming)
```

The browser never sees your API key — it only talks to your local server, which proxies the calls.

## 📋 Requirements

- **Node.js ≥ 18** (uses the built-in `fetch`) — [nodejs.org](https://nodejs.org)
- An **[OpenRouter](https://openrouter.ai) account with credit** — Lyria is a paid model
  (roughly $0.04–$0.10 per track; see [Estimated cost](#-estimated-cost))
- **git** (to clone)

## 🚀 Getting started

### 1. Install Node.js (if you don't have it)

| OS | Install |
| --- | --- |
| **Windows** | Installer from [nodejs.org](https://nodejs.org), or `winget install OpenJS.NodeJS.LTS` |
| **macOS** | `brew install node`, or the installer from [nodejs.org](https://nodejs.org) |
| **Linux (Debian/Ubuntu)** | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install -y nodejs` |

Verify with `node --version` (should print v18 or newer).

### 2. Get an OpenRouter API key

Create one at **<https://openrouter.ai/keys>** and make sure your account has credit.

### 3. Clone and install

```bash
git clone https://github.com/SonapSav/MusicStudio.git
cd MusicStudio
npm install
```

### 4. Add your key

Copy the sample env file, then paste your key into it:

| OS | Copy command |
| --- | --- |
| **macOS / Linux** | `cp .env.example .env` |
| **Windows (PowerShell)** | `Copy-Item .env.example .env` |
| **Windows (cmd)** | `copy .env.example .env` |

Then edit `.env` and set:

```
OPENROUTER_API_KEY=sk-or-...your key...
```

`.env` is git-ignored, so your key is never committed.

### 5. Run it

```bash
npm start          # or: npm run dev   (auto-reload on file changes)
```

The server prints its URL on startup — open it in your browser:

```
🎵 Music Studio running:
   Local:    http://localhost:3012
```

> The port comes from `PORT` in `.env`. The provided `.env.example` uses **3012**; change it to
> `3000` or anything you like.

## ⚙️ Configuration (`.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | ✅ | — | Your OpenRouter key (server-side only) |
| `PORT` | — | `3000` | Port the server listens on (sample uses `3012`) |
| `HOST` | — | `0.0.0.0` | Bind address; set `127.0.0.1` to restrict to this machine |
| `LYRICS_MODEL` | — | `anthropic/claude-sonnet-5` | Model used for AI lyrics & auto-naming |
| `ENHANCE_MODEL` | — | `anthropic/claude-sonnet-5` | Model used for AI arrangement |
| `APP_TITLE`, `APP_URL` | — | MusicStudio | Sent to OpenRouter for attribution (safe to leave) |

Music models used: `google/lyria-3-pro-preview` and `google/lyria-3-clip-preview`.

## 🎛️ Using it

1. Build a track with the pills (or type your own values), and optionally attach a reference image.
2. Need words? Open **Vocals & Lyrics → ✨ Write lyrics with AI**, give a theme, and Claude drafts them.
3. Want production direction? In **Arrangement**, click **🪄 Suggest arrangement**.
4. Click **Preview prompt** (free) to review/edit the exact prompt, then **Generate music**.
5. The result plays inline and is saved to your **Library** — download it, rename it, auto-name it
   from the lyrics, or hit the **🎲 dice** to generate a variation.

## 💸 Estimated cost

Lyria is billed per generation; the Claude helpers add ~$0.01 each. Rough per-track cost:

| | Music only | + AI lyrics / arrangement |
| --- | --- | --- |
| **Lyria 3 Clip** (30s) | ~$0.04 | up to ~$0.06 |
| **Lyria 3 Pro** (≤3 min) | ~$0.08 | up to ~$0.10 |

A reference image doesn't add a separate charge, and format (MP3/WAV) doesn't change the price.
The header shows your **live remaining balance**; your OpenRouter dashboard is the source of truth.

## 🌐 Access on your local network (optional)

The server binds to all interfaces by default, so other devices on the same Wi-Fi/LAN can reach it
at the **Network** URL printed on startup (e.g. `http://192.168.x.x:<PORT>`).

- **Firewall:** the first outside connection may prompt to allow Node.js — allow it, or add an
  inbound rule for your chosen port.
- **⚠️ Security:** there's no login, and anyone who opens the URL can generate music on **your**
  OpenRouter credit. Only expose it on a trusted network. To lock it to this machine only, set
  `HOST=127.0.0.1` in `.env` and restart.

## 🗂️ Project structure

```
server.js              Express server + API routes (holds the key, saves tracks)
src/promptBuilder.js   Form data → Lyria prompt
src/lyriaClient.js     OpenRouter/Lyria call + streaming audio reassembly
src/lyricsClient.js    Claude → original lyrics
src/enhanceClient.js   Claude → timestamped arrangement
src/nameClient.js      Claude → track titles
public/                Static UI (index.html, styles.css, app.js)
downloads/             Saved tracks + library.json  (git-ignored, created at runtime)
```

## 🛠️ Tech stack

Node.js + Express, vanilla HTML/CSS/JS (no build step). Music by **Google Lyria 3**, lyrics and
arrangement by **Claude (Anthropic)**, all via **OpenRouter**.

## 📝 Notes & limitations

- **SynthID watermark** — all Lyria audio contains an inaudible SynthID watermark.
- **Content safety** — Google's filter blocks prompts that reference real artists or copyrighted
  lyrics; the app surfaces a clear message when that happens.
- **Experimental options** — the Greek genres/instruments/modes are marked *experimental*; Lyria
  approximates them rather than reproducing them exactly.
- **Streaming audio** — Lyria returns audio as a stream of base64 chunks, which the client
  reassembles into a single MP3/WAV.

## 🙌 Credits

Developed by **Panos Vasilopoulos** & **Claude**.

## 📄 License

No license is specified yet, so default copyright applies. If you'd like others to reuse the code,
add a license (e.g. [MIT](https://choosealicense.com/licenses/mit/)).
