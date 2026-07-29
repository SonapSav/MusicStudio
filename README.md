# 🎵 MusicStudio

A small local web app that generates music with **Google Lyria 3 Pro** through the
[OpenRouter](https://openrouter.ai) API. You fill in a form (genre, era, mood,
instrumentation, tempo, vocals, lyrics…), the app assembles a prompt following the
official Lyria prompting framework, sends it to Lyria, then plays the result and
lets you download it.

## How it works

```
Browser UI  ──fetch──►  Local Node server  ──►  OpenRouter  ──►  Lyria 3 Pro
(form + player)         (holds API key,
                         builds the prompt)
```

Your API key lives only in a local `.env` file and never reaches the browser.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your OpenRouter API key**

   Copy the example env file and paste your key (get one at
   <https://openrouter.ai/keys>):

   ```bash
   cp .env.example .env
   ```

   Then edit `.env`:

   ```
   OPENROUTER_API_KEY=sk-or-...your key...
   ```

3. **Start the server**

   ```bash
   npm start
   ```

4. Open the app in your browser at the port the server prints on startup.
   The port is set by `PORT` in `.env` (defaults to `3000`). **This install is
   configured to run on port 3012** (`PORT=3012`) — so open
   <http://localhost:3012>.

## Using it

1. Fill in as much or as little of the form as you like.
2. Click **Preview prompt** to see (and edit) the exact text that will be sent —
   this is free and makes no API call.
3. Click **Generate music**. When it finishes, the track plays inline and a
   **Download** button appears.

### Writing lyrics with AI

Inside the **Vocals** section (when *Instrumental* is off) there's a **✨ Write
lyrics with AI** helper. Give it a theme (plus optional story/keywords,
structure, and rhyme style) and click **Generate lyrics** — Claude Sonnet
(via OpenRouter) drafts **original**, structured lyrics with `[Verse]` /
`[Chorus]` / `[Bridge]` markers straight into the Lyrics box, reusing your
Genre / Mood / Language selections. Everything is editable afterward.

The lyric model is configurable via `LYRICS_MODEL` in `.env` (any OpenRouter
chat model; defaults to `anthropic/claude-sonnet-5`). Lyrics are always original
— the model is instructed never to imitate real artists or existing songs.

### AI arrangement suggestions

Next to **Extra details** there's a **Suggest arrangement** button. It sends your
current style settings *and* the lyrics to a text model, which writes concise,
**timestamped production direction** — section-by-section instrument entrances,
builds, drops, transitions and mix textures — aligned to your `[Verse]`/`[Chorus]`
structure and scaled to the target duration (30s clip vs. full Pro track). The
result fills the Extra details box for you to edit. Configurable via
`ENHANCE_MODEL` in `.env`.

### Reference image (experimental)

At the top of **Style** you can attach a reference image (PNG/JPG). Lyria uses it
to steer the track's vibe, genre, and lyric direction. It's sent as a top-level
`image` field (data URI) on the generation request.

### Key / time signature / mode

The Style section has a **Key**, **Time signature**, and **Mode / scale** row.
These are added to the prompt as natural language ("In D minor, 9/8 time, and the
Hijaz mode"). Greek meters (7/8, 9/8, 5/8) and *dromoi* (Hijaz, Rast, Ussak…) are
grouped as experimental options.

### Seed & variations

Every generation records a **seed** (shown on the saved track). Leave the Seed
field blank for a fresh random seed each time, or set it to reproduce a result.
In the Library, the **dice** button on a track generates a **variation** — same
prompt, new random seed.

### Prompt framework

The prompt is assembled as:

> `[Genre/Era] + [Mood] + [Instrumentation] + [Tempo/Rhythm] + [Vocals/Language] + [Lyrics]`

- **Lyrics** use the literal `Lyrics:` marker. You can use section markers like
  `[Verse]`, `[Chorus]`, background echoes `(go)`, and timestamps `[0:00 - 0:10]`.
- Toggle **Instrumental** to force a backing track with no vocals.

## Models & pricing

| Model                        | Length            | Notes                     |
| ---------------------------- | ----------------- | ------------------------- |
| `google/lyria-3-pro-preview` | up to ~3 min song | full structure, ~$0.08/song |
| `google/lyria-3-clip-preview`| exactly 30s       | best for loops, ~$0.04/clip |

*(Pricing per OpenRouter listings; check the site for current rates.)*

## Project structure

```
server.js              Express server + API routes
src/promptBuilder.js   Form data  -> Lyria prompt
src/lyriaClient.js     OpenRouter call + audio extraction
public/                Static UI (index.html, styles.css, app.js)
```

## Access on your local network

The server binds to all interfaces, so other devices on the same Wi-Fi/LAN can
reach it. On startup it prints the address to use, e.g.:

```
Local:    http://localhost:3012
Network:  http://192.168.0.53:3012
```

Open the **Network** URL from a phone or another computer on the same network.
(This install runs on port **3012**, set via `PORT` in `.env`; the default is 3000.)

- **Firewall:** the first time, Windows may ask to allow Node.js on private
  networks — allow it. If it won't connect, add an inbound rule for the port
  in use (TCP 3012 here).
- **Security:** there's no login, and anyone who opens it can generate music
  using **your** OpenRouter key (which costs money). Only expose it on a trusted
  network. To lock it back to this machine only, set `HOST=127.0.0.1` in `.env`.

## Output format (MP3 / WAV)

A **Format** selector sits next to the model. MP3 is the default high-quality
master; **WAV (lossless)** is available on **Lyria 3 Pro only** — selecting WAV
with the Clip model automatically falls back to MP3 (and warns you). Lyria has
no separate "low/medium/high" quality tiers — it always returns one high-fidelity
master, and the format choice picks the container.

## Library / history

Every generated track is saved to a local `downloads/` folder (git-ignored) and
listed in a **Library** panel at the bottom of the page, newest first. For each
track you can:

- **Play** it inline
- **Download** it
- **Vary** it (dice icon) — regenerate from the same prompt with a fresh seed
- **Auto-name** it (sparkles icon) — suggest a title: from the **lyrics** if the
  track has them, otherwise a creative title invented from its **style/prompt**
  (only disabled for old tracks with no stored prompt)
- **Rename** it (updates both the display name and the file on disk)
- **Delete** it (removes the file permanently)

A small `downloads/library.json` manifest tracks names and prompts; audio files
found on disk but not in the manifest are adopted automatically.

## Notes on the response format

The Lyria audio models on OpenRouter **require streaming** (`stream: true`).
The audio is returned as base64 chunks over Server-Sent Events, which
`src/lyriaClient.js` reassembles into a single MP3 (44.1/48 kHz stereo, with the
non-audible SynthID watermark embedded as ID3 metadata). If a future model
variant returns audio differently and reassembly finds nothing, the UI surfaces
details under **Debug: raw response**.

## Security & ethics

- The API key stays server-side (in `.env`, git-ignored).
- Lyria embeds a non-audible **SynthID** watermark in all output.
- Prompts requesting specific real artists' voices or copyrighted lyrics are
  blocked by the model.
