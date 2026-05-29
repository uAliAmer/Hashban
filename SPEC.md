# SPEC — Hashban

Single-page Kanban. Whole board state lives in URL hash. ⊥ backend. Share URL = share board.

## §G — goals
- Kanban board SPA. State encoded fully in URL hash `#<payload>`.
- ⊥ backend, ⊥ DB, ⊥ runtime network. Deploy = static host or `file://`-equivalent (built SPA).
- Share `location.href` → recipient sees identical board.
- Open source: README + LICENSE shipped.

## §C — constraints
- Stack: React + Vite + TypeScript + TailwindCSS + shadcn/ui. Build step → static `dist/`.
- Hash = single source of truth for state. `localStorage` = cache/autosave fallback only, ⊥ authoritative.
- ⊥ telemetry, ⊥ external fetch at runtime. ⊥ server-side state.
- Compression !: `lz-string` `compressToEncodedURIComponent`. URL caps ~2k–64k chars by browser → soft limit 8000 → warn.
- Browsers: evergreen Chrome/FF/Safari latest 2.

## §I — interfaces
```
type Card  = { id: string; txt: string; desc?: string; color?: string; due?: string }
type Col   = { id: string; name: string; cards: Card[]; wip?: number }
type Board = { t: string; cols: Col[] }

hash:  #<lz-string compressToEncodedURIComponent(JSON.stringify(Board))>

encode(board: Board): string                 // lz compress -> hash payload
decode(payload: string): Board | null        // null on parse/decompress fail
useBoard(): { board, dispatch }              // hook: state from hash, actions
commit(board: Board): void                   // write hash + localStorage cache
```
- event: `window 'hashchange'` → decode → re-render (cross-tab, back-button).
- ui: "Copy share URL" → clipboard = `location.href`.
- ui: import/export JSON; undo/redo; clear board. shadcn components.

## §V — invariants
- V1: hash = single source of truth. ∀ state change → `commit()` writes hash.
- V2: `decode(encode(b))` deep-equal `b`. roundtrip lossless.
- V3: decode fail → load default board. ⊥ crash, ⊥ silent wipe of valid hash.
- V4: ∀ card & col → unique `id`. collision ⊥.
- V5: drag-drop move/reorder → mutate state then `commit()`. DOM ⊥ authoritative.
- V6: ∀ load & edit → 0 runtime network requests.
- V7: payload length ≥ 8000 → warn user, still function.
- V8: empty hash on load → default board (cols Todo/Doing/Done).
- V9: undo/redo operate on state snapshots, each step re-commits hash.
- V10: first visit (⊥ hash & ⊥ cache) → seed demo board. returning|shared user untouched.
- V11: search/filter = ephemeral UI state. ⊥ in board, ⊥ in hash, ⊥ persisted.
- V12: col `wip?` set & cards.length > wip → over-limit signal. ⊥ block add (soft limit).
- V13: roundtrip ! survive optional `wip` (V2 holds w/ & w/o field).

## §T — tasks
```
id|status|task|cites
T1|x|scaffold Vite+React+TS+Tailwind+shadcn|C
T2|x|Board types + encode/decode + roundtrip test|I,V2
T3|x|useBoard hook: hash<->state sync, hashchange listener|V1,V3,V8
T4|x|render board: cols + cards from state|I
T5|x|card CRUD: add/edit/delete|G
T6|x|column CRUD: add/rename/delete + board title|G
T7|x|drag-drop move + reorder (dnd-kit)|V5
T8|x|card meta: color label, due date, description|G
T9|x|copy share URL button + near-limit warn|V7
T10|x|localStorage autosave fallback|C,V1
T11|x|import/export JSON|G
T12|x|undo/redo via state snapshots|V9
T13|x|README + LICENSE|G
T14|x|first-visit demo board seed|V10,V8
T15|x|card search/filter (ephemeral)|V11
T16|x|column WIP limits (`wip?` field)|V12,V13
T17|x|keyboard nav: arrows focus, Enter edit, Del delete, n new|G
T18|x|mobile touch-drag (dnd-kit TouchSensor + delay)|V5
T19|x|Cloudflare Pages prep (build cfg + headers)|C,G
```

## §B — bugs
```
id|date|cause|fix
```
