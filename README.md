# Hashban

A single-page Kanban board whose **entire state lives in the URL hash**. No
backend, no database, no accounts, no network calls at runtime. **Share the URL
= share the board.**

Open the page, build your board, hit **Share** — the link you copy *is* the
board. Anyone who opens it sees exactly what you see.

## How it works

The whole board (title, columns, cards, colors, due dates) is serialized to
JSON, compressed with [`lz-string`](https://github.com/pieroxy/lz-string), and
stored in `location.hash`:

```
https://you.example/#N4Ig…compressed-state…
```

The hash is the single source of truth. Every edit re-encodes the board into
the URL. `localStorage` is used only as an offline cache for reopening the bare
page — it is never authoritative.

Because nothing leaves the browser, there is no server to run, nothing to host
beyond a static file, and no privacy backend: your board lives only in your URL
bar and wherever you paste it.

## Features

- **Demo on first visit** — a pre-loaded sample board greets new users; returning
  users and shared-link recipients always see their own board.
- Columns + cards, full CRUD (add / edit / delete / rename).
- **Drag-and-drop** cards within and across columns; reorder freely. Works on
  mobile (touch + press-delay to disambiguate from scrolling).
- **Card metadata** — label color, due date (overdue highlight), description.
- **Column WIP limits** — click the card count badge to set a limit; the badge
  turns red when exceeded (soft limit, never blocks adding).
- **Search / filter** — type in the toolbar to instantly dim non-matching cards
  across all columns; filter is ephemeral and never saved to the URL.
- **Keyboard navigation** — arrows move focus between cards, `Enter` edits,
  `Delete`/`Backspace` removes, `n` adds a new card to the focused column.
- Editable board title and column names.
- **Share** button copies the live URL to your clipboard.
- Import / Export the board as a JSON file.
- Undo / Redo (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` or `Ctrl+Y`).
- Long-URL warning when the encoded state nears browser length limits (~8 000 chars).
- Cross-tab / back-button sync via `hashchange`.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move focus between cards in a column |
| `←` / `→` | Jump focus to adjacent column |
| `Enter` | Open edit dialog for focused card |
| `Delete` / `Backspace` | Delete focused card |
| `n` | Add a new card to the focused column |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` / `Ctrl+Y` | Redo |

## Develop

```bash
npm install
npm run dev      # Vite dev server  →  http://localhost:5173
npm run test     # Vitest unit tests (30 tests)
npm run build    # TypeScript check + Vite bundle  →  dist/
npm run preview  # Serve the production build locally
```

Stack: React 19 + Vite 6 + TypeScript + Tailwind CSS v4, drag-and-drop via
[`@dnd-kit`](https://dndkit.com/). UI primitives follow shadcn/ui conventions
(`class-variance-authority` + `tailwind-merge`), hand-rolled so the app has no
runtime fetch dependencies.

## Deploy to Cloudflare Pages

**Dashboard (recommended):**

1. Connect the GitHub repo in the Cloudflare Pages dashboard.
2. Build command: **`npm run build`** · Output directory: **`dist`**
3. Done — every push to `main` deploys automatically.

> **Note:** do not use `npm run deploy:local` as the Pages build command —
> that script calls `wrangler pages deploy` which is only for local CLI use.
> Cloudflare Pages handles the publish step itself; it only needs the build.

**CLI (local, wrangler authenticated):**

```bash
npm run deploy:local   # npm run build + wrangler pages deploy dist
```

`public/_headers` ships with the build and tells Cloudflare to cache fingerprinted
assets forever while keeping `index.html` uncached — so old shared URLs always
load the latest shell but assets are served from edge cache instantly.

## Deploy anywhere else

`npm run build` emits a static `dist/`. Drop it on GitHub Pages, Netlify, Vercel,
an S3 bucket, or open `dist/index.html` directly — there is no server component.

## Caveats

- URLs have length limits (~2k–64k chars depending on browser). Very large
  boards may exceed them when shared; the app warns past ~8 000 chars.
- Anyone with the link has the board — treat the URL like the data it contains.

## License

[MIT](./LICENSE)
