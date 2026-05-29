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

- Columns + cards, full CRUD (add / edit / delete / rename).
- Drag-and-drop cards within and across columns; reorder freely.
- Card metadata: label color, due date (overdue highlight), description.
- Editable board title and columns.
- **Share** button copies the live URL to your clipboard.
- Import / Export the board as a JSON file.
- Undo / Redo (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` or `Ctrl+Y`).
- Long-URL warning when the encoded state nears browser length limits.
- Cross-tab / back-button sync via `hashchange`.

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run test     # vitest unit tests
npm run build    # type-check + bundle to dist/
npm run preview  # serve the production build
```

Stack: React + Vite + TypeScript + Tailwind CSS, drag-and-drop via
[`@dnd-kit`](https://dndkit.com/). UI primitives follow shadcn/ui conventions
(`class-variance-authority` + `tailwind-merge`), hand-rolled so the app has no
runtime fetch dependencies.

## Deploy

`npm run build` emits a static `dist/`. Host it anywhere that serves files
(GitHub Pages, Netlify, an S3 bucket) — or just open `dist/index.html`. There is
no server component.

## Caveats

- URLs have length limits (~2k–64k chars depending on browser). Very large
  boards may exceed them when shared; the app warns past ~8000 chars.
- Anyone with the link has the board — treat the URL like the data it contains.

## License

[MIT](./LICENSE)
