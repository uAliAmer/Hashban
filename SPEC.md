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
type CheckItem = { id: string; txt: string; done: boolean }
type Card  = { id: string; txt: string; desc?: string; color?: string; due?: string; checklist?: CheckItem[]; priority?: 'P1'|'P2'|'P3'; laneId?: string }
type Lane  = { id: string; name: string }
type Col   = { id: string; name: string; cards: Card[]; wip?: number; color?: string }
type Board = { t: string; cols: Col[]; lanes?: Lane[] }

hash:  #<lz-string compressToEncodedURIComponent(JSON.stringify(Board))>

encode(board: Board): string                 // lz compress -> hash payload
decode(payload: string): Board | null        // null on parse/decompress fail
useBoard(): { board, dispatch }              // hook: state from hash, actions
commit(board: Board): void                   // write hash + localStorage cache
templateBoard(name: 'sprint'|'gtd'|'hiring'): Board  // preset boards
```
- event: `window 'hashchange'` → decode → re-render (cross-tab, back-button).
- ui: "Copy share URL" → clipboard = `location.href`.
- ui: import/export JSON; undo/redo; clear board. shadcn components.
- ui: QR dialog → `qrcode.toDataURL(location.href)` client-side, ⊥ fetch.

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
- V14: card `checklist?` items ! have unique ids within card. roundtrip preserves all items & done state.
- V15: col `color?` string | absent. roundtrip preserves. set → tints whole column translucent (`+22` fill, `+66` border) over `backdrop-blur-md` glass. ⊥ color → theme bg.
- V16: card `priority?` ∈ {P1,P2,P3} | absent. roundtrip preserves.
- V17: `board.lanes?` optional. absent → single implicit lane. card `laneId?` absent → implicit lane. roundtrip preserves.
- V18: `?template=<name>` param & ⊥ hash → seed template board, remove param. existing hash → ignore param (V10 extended).
- V19: QR gen client-side via `qrcode` lib. ⊥ external fetch (V6 extended).
- V20: col drag-reorder → `moveColumn` op → commit (V5 extended). ⊥ col id collision w/ card ids.
- V21: multi-board index ∈ localStorage only. ⊥ authoritative. hash = source of truth for active board (V1 preserved).
- V22: compact view = ephemeral display toggle. ⊥ hash, ⊥ persisted (V11 pattern).
- V23: col collapse = ephemeral per-col toggle. ⊥ hash, ⊥ persisted.
- V24: board index stored in IndexedDB (`hashban` db, `boards` store). localStorage `hashban:boards` migrated on first open then removed. localStorage `hashban:last` (autosave cache) unchanged — single string, sync read required at init.
- V25: card labels ∈ board-level `board.labels[]` registry (`{id,name,color}`). card carries `labels[]` = id refs, ⊥ inline copies. delete label → strip id from ∀ cards (`deleteLabel`). roundtrip lossless (V2).
- V26: label display mode (text pill | color-only bar) = ephemeral global toggle. ⊥ hash, ⊥ persisted (V11 pattern). Trello-style: color-only = collapsed, text = expanded. Trigger = click any label chip on card face → stopPropagation (⊥ open editor, ⊥ start drag).

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
T20|x|card checklists (checklist items, progress on card face, edit in dialog)|V14,V2
T21|x|column colors (color tint on header, swatch picker)|V15,V2
T22|x|card priority P1/P2/P3 (badge on card, set in dialog)|V16,V2
T23|x|swimlanes (Lane type, grid layout when lanes set, CRUD + reorder)|V17,V5
T24|x|board templates (?template= param → preset board seed)|V18,V10
T25|x|QR code (client-side QR dialog from Share button)|V19,V6
T26|x|column drag-and-drop reorder (dnd-kit sortable on columns)|V20,V5
T27|x|multiple boards (localStorage index, board switcher in toolbar)|V21,V1
T28|x|compact view (toolbar toggle, cards collapse to title-only rows)|V22
T29|x|column collapse (fold column to slim vertical bar, ephemeral)|V23
T30|x|IndexedDB board index (replace localStorage, migrate existing data)|V24
T31|x|board label registry (Label type, create/edit/delete in card dialog, toggle on card, chips on card face)|V25,V2
T32|x|label display toggle (click chip on card face → text pills vs color-only bars, Board+SwimBoard)|V26,V11
T33|x|label create UX (live preview pill, swatch grid, rapid multi-add via Enter)|V25
```

## §B — bugs
```
id|date|cause|fix
```
