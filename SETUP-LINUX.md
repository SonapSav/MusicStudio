# Running MusicStudio on Debian 12 (Linux)

MusicStudio is plain Node.js and uses only cross-platform APIs, so it runs on
Linux with **no code changes**. These steps move it from a Windows machine (via
USB stick) to Debian 12 and get it running.

---

## 1. Copy the project to the USB stick

Copy the whole `MusicStudio` folder. Notes:

- **`node_modules/`** — skip it (large; you'll reinstall on Linux). Copying it
  anyway is harmless — `npm install` will reconcile it — but cleanest is to leave
  it out.
- **`.env`** — contains your **secret OpenRouter API key**. It gets copied like
  any file, which is what you need on the other machine — but the key is now on
  the USB stick, so **delete it from the stick afterward** and don't leave the
  stick unattended.
- **`downloads/`** — copy only if you want your saved tracks + library on the
  other machine. Optional.

> Tip: `.env` is a "dotfile" and is hidden by default in Linux file managers
> (press **Ctrl+H** to reveal hidden files). If your copy tool skipped it, you
> can recreate it from `.env.example` (step 3).

---

## 2. Install Node.js (need version ≥ 18)

Pick one option.

**Simple — Debian repo (Node 18):**

```bash
sudo apt update && sudo apt install -y nodejs npm
```

**Recommended — Node 20 LTS via NodeSource:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

Verify:

```bash
node --version    # should print v18.x or newer
```

---

## 3. Install dependencies and add your key

Copy the folder off the USB stick to somewhere convenient (e.g. your home
directory), then:

```bash
cd ~/MusicStudio
npm install
```

Make sure `.env` exists with your key. If you didn't copy it, create it from the
template:

```bash
cp -n .env.example .env
```

Then open `.env` in a text editor and paste your real key:

```
OPENROUTER_API_KEY=sk-or-...your key...
```

---

## 4. Run it

```bash
npm start
```

Open the app at the port the server prints on startup. It's set by `PORT` in
`.env` (defaults to `3000`); if you copied this project's `.env`, it's **3012**
— so **http://localhost:3012**.

To stop the server, press **Ctrl+C** in the terminal.

For development with auto-reload on file changes:

```bash
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `.env` missing after copy | Dotfiles are hidden — press **Ctrl+H** in the file manager, or recreate from `.env.example` (step 3). |
| Port already in use | Change the port via `PORT` in `.env` (this project uses `PORT=3012`), or run a one-off: `PORT=8080 npm start` |
| `npm install` fails | It needs internet to fetch `express` + `dotenv`. Check your connection. After install, the app runs offline except for the actual OpenRouter API calls. |
| "No API key" banner in the UI | `.env` is missing or `OPENROUTER_API_KEY` is blank. Fix `.env` and restart. |
| `node: command not found` | Node didn't install — redo step 2. |

---

## Notes

- Only two dependencies (`express`, `dotenv`), both pure JavaScript — nothing to
  compile, no native modules.
- The same commands work everywhere: `npm install`, `npm start`, `npm run dev`.
  The only Windows-vs-Linux difference is stopping the server (**Ctrl+C** on
  Linux).
- Generated tracks are saved under `downloads/` on whichever machine created
  them; the library is per-machine unless you copy that folder across.
