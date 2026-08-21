# Zonk — Sleeper Draft Tracker

Track a live [Sleeper](https://sleeper.com) fantasy football draft against your own custom
player rankings. As picks come in, drafted players are crossed off and the best
available players float to the top — so you always know who to take next.

## Features

- **Connect by Sleeper username** — no login or API key needed (Sleeper's API is public and read-only)
- **Pick your league and draft**, or paste a draft ID directly (works for mock drafts too)
- **Bring your own rankings** as a CSV (upload, paste, or use the bundled default board)
- **Live tracking** — polls the draft every few seconds, marks drafted players, and highlights your top available targets
- **Filters** — by position (including IDP: DL/LB/DB), search, and show/hide drafted
- **Resilient** — state persists in your browser, so a page reload during the draft won't lose anything

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173, enter your Sleeper username, and follow the steps.

## Rankings CSV format

Only `full_name` (or `name` / `player`) is required. Recognized columns
(case, spaces, and underscores are ignored):

```csv
full_name,position,age,years_exp,ppg,availability_score,risk_cv,dcf_value,replacement_value,value_above_replacement
Christian McCaffrey,RB,28,7,22.4,0.91,0.18,145.2,88.1,57.1
CeeDee Lamb,WR,25,4,19.8,0.88,0.21,138.7,82.4,56.3
```

Players are ranked by **value above replacement** (VORP), highest first. If no
VORP column is present, the row order of your file is kept.

The bundled default board (`public/draft_board.csv`) is tuned for **Dynasty IDP**
leagues — bring your own rankings for redraft formats.

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Type-check and build for production (`dist/`) |
| `npm run preview`   | Preview the production build    |
| `npm run lint`      | Run ESLint                      |
| `npm run typecheck` | Type-check without emitting     |

## Sharing / deploying

Zonk is a fully static app — no server, no secrets, no login. Everyone you
share the deployed URL with can track their own drafts; all state stays in
their own browser.

```bash
npm run build   # outputs to dist/ — deploy anywhere (Netlify, Vercel, …)
```

The build uses relative asset paths (`base: './'`), so it works served from a
domain root or from any subpath.

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · PapaParse
