# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Hashban — a single-page Kanban board whose **entire state lives in the URL hash**. No backend, no DB, no runtime network. Sharing the URL shares the board. React 19 + Vite + TypeScript + Tailwind v4. Deployed as a static SPA on Cloudflare Pages.

## Commands

```bash
npm run dev          # vite dev server
npm run build        # tsc -b && vite build  (typecheck + bundle to dist/)
npm test             # vitest run (one-shot)
npm run test:watch   # vitest watch mode
npm run deploy:local # build + wrangler pages deploy dist
```

Run a single test file or test:
```bash
npx vitest run src/lib/board.test.ts
npx vitest run -t "roundtrip"   # by test name pattern
```

There is no linter configured. `npm run build` is the typecheck gate.

## Architecture

**The hash is the single source of truth.** Everything else (localStorage, IndexedDB) is cache.

Data flow:
1. `src/lib/board.ts` — types (`Board`/`Col`/`Card`/`Lane`/`Label`/`CheckItem`) and the codec. `encode`/`decode` go through a compact "wire" format (short keys) → CBOR (`cbor-x`) → deflate (`fflate`) → base64url. `decode` is defensive: returns `null` on any failure and `isBoard()` structurally validates before trusting a payload. Also holds `defaultBoard`, `demoBoard`, `templateBoard`.
2. `src/lib/ops.ts` — all board mutations as **pure functions** returning a new `Board` (immutable). Add/update/delete cards/columns/lanes/labels/checklist items, drag-drop moves. Never mutate in place.
3. `src/hooks/useBoard.ts` — the engine. Resolves initial board (hash > localStorage cache > demo/template/default), `commit()` writes the hash + caches to localStorage, listens to `hashchange` for cross-tab/back-button sync, and holds the undo/redo snapshot stacks. A `writing` ref guards against the app's own hash writes re-triggering `hashchange`.
4. `src/hooks/useBoardIndex.ts` + `src/lib/db.ts` — the "multiple boards" sidebar, backed by IndexedDB (`hashban` DB, `boards` store). One-time migration from the old `hashban:boards` localStorage key. `autoSave` upserts by board title; manual `saveBoard` dedupes names.
5. `src/components/` — `Board.tsx` (column view) vs `SwimBoard.tsx` (swimlane grid, used when `board.lanes` is non-empty), `Column.tsx`, `CardItem.tsx`, `CardDialog.tsx` (card editor), `Toolbar.tsx` (share/QR/shorten, undo/redo, search, templates). `ui/` is shadcn-style primitives.

### Editing the data model
A new card/column field touches several places in lockstep:
- `Card`/`Col`/etc. type in `board.ts`
- the `Wire*` type + `toWire`/`fromWire` mappers (pick a new short key)
- `isBoard()` validation
- a mutation in `ops.ts`
- the roundtrip tests assert `decode(encode(b))` deep-equals `b` (invariant V2) — keep them passing.

### Share / QR / URL shortening
`Toolbar.tsx` posts the full URL to an **external** Cloudflare Worker (`hashban-short.ali-demo.workers.dev`, hardcoded as `SHORTENER_URL`) to get a short link; the QR code is always generated from the short link. That Worker lives in a separate repo, not this one. This is the only runtime network call and it's user-initiated (the no-backend invariant covers board load/edit).

## SPEC-driven workflow

This repo uses spec-driven development. `SPEC.md` at the root is the contract: `§G` goals, `§C` constraints, `§I` interfaces, `§V` invariants (V1–V25), `§T` task log, `§B` bug log. Code comments cite invariants (e.g. `// §V.3`). When you change behavior, update the matching `§V`/`§T`. The `/spec`, `/build`, `/check`, and `backprop` skills read and write this file.

**Known drift:** `SPEC.md §C/§I` still describe `lz-string` compression and a plain-JSON hash. The code has since moved to the CBOR + deflate + base64url wire format described above. Trust the code; the spec text is stale on this point.

## Conventions

- Path alias: `@/` → `src/` (see `vite.config.ts`).
- Tests use vitest + jsdom + `@testing-library/react`.
- IDs come from `genId()` (crypto.randomUUID with fallback). Never reuse IDs (invariant V4).
- Mutations are pure and immutable — add new ops to `ops.ts`, don't mutate boards inline in components.
- `SOFT_LIMIT = 8000` chars: over it, warn but keep working (V7).
