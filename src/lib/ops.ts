import { Board, Card, CheckItem, Col, Label, Lane, genId } from "./board";

// Pure board transforms. Each returns a NEW board (immutable) so callers
// pass result straight to setBoard -> commit (§V.1 §V.5).

export function addCard(b: Board, colId: string, txt: string): Board {
  const card: Card = { id: genId(), txt };
  return mapCol(b, colId, (c) => ({ ...c, cards: [...c.cards, card] }));
}

export function updateCard(
  b: Board,
  colId: string,
  cardId: string,
  patch: Partial<Card>
): Board {
  return mapCol(b, colId, (c) => ({
    ...c,
    cards: c.cards.map((cd) =>
      cd.id === cardId ? { ...cd, ...patch, id: cd.id } : cd
    ),
  }));
}

export function deleteCard(b: Board, colId: string, cardId: string): Board {
  return mapCol(b, colId, (c) => ({
    ...c,
    cards: c.cards.filter((cd) => cd.id !== cardId),
  }));
}

export function addColumn(b: Board, name: string): Board {
  const col: Col = { id: genId(), name, cards: [] };
  return { ...b, cols: [...b.cols, col] };
}

export function renameColumn(b: Board, colId: string, name: string): Board {
  return mapCol(b, colId, (c) => ({ ...c, name }));
}

export function deleteColumn(b: Board, colId: string): Board {
  return { ...b, cols: b.cols.filter((c) => c.id !== colId) };
}

export function renameBoard(b: Board, t: string): Board {
  return { ...b, t };
}

// §V.12 — set or clear a column WIP limit. undefined|≤0 removes it.
export function setColumnWip(b: Board, colId: string, wip?: number): Board {
  return mapCol(b, colId, (c) => {
    const next = { ...c };
    if (wip === undefined || wip <= 0 || Number.isNaN(wip)) delete next.wip;
    else next.wip = Math.floor(wip);
    return next;
  });
}

// drag-drop: move card to target column at target index. §V.5
export function moveCard(
  b: Board,
  fromCol: string,
  toCol: string,
  cardId: string,
  toIndex: number
): Board {
  const src = b.cols.find((c) => c.id === fromCol);
  const card = src?.cards.find((cd) => cd.id === cardId);
  if (!card) return b;
  const cols = b.cols.map((c) => {
    if (c.id === fromCol) {
      return { ...c, cards: c.cards.filter((cd) => cd.id !== cardId) };
    }
    return c;
  });
  return {
    ...b,
    cols: cols.map((c) => {
      if (c.id !== toCol) return c;
      const next = [...c.cards];
      const idx = Math.max(0, Math.min(toIndex, next.length));
      next.splice(idx, 0, card);
      return { ...c, cards: next };
    }),
  };
}

// reorder whole columns (drag column headers). §V.5
export function moveColumn(b: Board, fromIdx: number, toIdx: number): Board {
  const cols = [...b.cols];
  const [c] = cols.splice(fromIdx, 1);
  if (!c) return b;
  cols.splice(toIdx, 0, c);
  return { ...b, cols };
}

// §V.15 — set or clear column color
export function setColumnColor(b: Board, colId: string, color?: string): Board {
  return mapCol(b, colId, (c) => {
    const next = { ...c };
    if (color) next.color = color;
    else delete next.color;
    return next;
  });
}

// §V.14 — checklist ops (all pure, return new Board)
export function addCheckItem(b: Board, colId: string, cardId: string, txt: string): Board {
  const item: CheckItem = { id: genId(), txt, done: false };
  return mapCard(b, colId, cardId, (cd) => ({
    ...cd,
    checklist: [...(cd.checklist ?? []), item],
  }));
}

export function toggleCheckItem(b: Board, colId: string, cardId: string, itemId: string): Board {
  return mapCard(b, colId, cardId, (cd) => ({
    ...cd,
    checklist: cd.checklist?.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i
    ),
  }));
}

export function deleteCheckItem(b: Board, colId: string, cardId: string, itemId: string): Board {
  return mapCard(b, colId, cardId, (cd) => ({
    ...cd,
    checklist: cd.checklist?.filter((i) => i.id !== itemId),
  }));
}

export function updateCheckItemTxt(b: Board, colId: string, cardId: string, itemId: string, txt: string): Board {
  return mapCard(b, colId, cardId, (cd) => ({
    ...cd,
    checklist: cd.checklist?.map((i) =>
      i.id === itemId ? { ...i, txt } : i
    ),
  }));
}

// §V.17 — swimlane ops
export function addLane(b: Board, name: string): Board {
  const lane: Lane = { id: genId(), name };
  return { ...b, lanes: [...(b.lanes ?? []), lane] };
}

export function renameLane(b: Board, laneId: string, name: string): Board {
  return { ...b, lanes: b.lanes?.map((l) => l.id === laneId ? { ...l, name } : l) };
}

export function deleteLane(b: Board, laneId: string): Board {
  const cols = b.cols.map((c) => ({
    ...c,
    cards: c.cards.map((cd) => cd.laneId === laneId ? { ...cd, laneId: undefined } : cd),
  }));
  return { ...b, cols, lanes: b.lanes?.filter((l) => l.id !== laneId) };
}

export function moveLane(b: Board, fromIdx: number, toIdx: number): Board {
  const lanes = [...(b.lanes ?? [])];
  const [l] = lanes.splice(fromIdx, 1);
  if (!l) return b;
  lanes.splice(toIdx, 0, l);
  return { ...b, lanes };
}

export function setCardLane(b: Board, colId: string, cardId: string, laneId: string | undefined): Board {
  return mapCard(b, colId, cardId, (cd) => {
    const next = { ...cd };
    if (laneId) next.laneId = laneId;
    else delete next.laneId;
    return next;
  });
}

// §V.25 — board-level label registry ops
export function addLabel(b: Board, name: string, color: string): Board {
  const label: Label = { id: genId(), name, color };
  return { ...b, labels: [...(b.labels ?? []), label] };
}

export function updateLabel(b: Board, id: string, patch: Partial<Omit<Label, "id">>): Board {
  return { ...b, labels: (b.labels ?? []).map((l) => l.id === id ? { ...l, ...patch } : l) };
}

export function deleteLabel(b: Board, id: string): Board {
  // remove from registry AND strip from every card
  const cols = b.cols.map((c) => ({
    ...c,
    cards: c.cards.map((cd) =>
      cd.labels?.includes(id) ? { ...cd, labels: cd.labels.filter((x) => x !== id) } : cd
    ),
  }));
  return { ...b, cols, labels: (b.labels ?? []).filter((l) => l.id !== id) };
}

// toggle a label id on a card
export function toggleCardLabel(b: Board, colId: string, cardId: string, labelId: string): Board {
  return mapCard(b, colId, cardId, (cd) => {
    const cur = cd.labels ?? [];
    const next = cur.includes(labelId) ? cur.filter((x) => x !== labelId) : [...cur, labelId];
    const out = { ...cd };
    if (next.length) out.labels = next;
    else delete out.labels;
    return out;
  });
}

function mapCol(b: Board, colId: string, fn: (c: Col) => Col): Board {
  return { ...b, cols: b.cols.map((c) => (c.id === colId ? fn(c) : c)) };
}

function mapCard(b: Board, colId: string, cardId: string, fn: (cd: Card) => Card): Board {
  return mapCol(b, colId, (c) => ({
    ...c,
    cards: c.cards.map((cd) => cd.id === cardId ? fn(cd) : cd),
  }));
}
