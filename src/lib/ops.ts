import { Board, Card, Col, genId } from "./board";

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

function mapCol(b: Board, colId: string, fn: (c: Col) => Col): Board {
  return { ...b, cols: b.cols.map((c) => (c.id === colId ? fn(c) : c)) };
}
