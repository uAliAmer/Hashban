import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Board as BoardT, Card } from "@/lib/board";
import {
  addCard,
  addColumn,
  deleteCard,
  deleteColumn,
  moveCard,
  renameColumn,
  setColumnColor,
  setColumnWip,
  updateCard,
} from "@/lib/ops";
import { Column } from "./Column";
import { CardItem } from "./CardItem";
import { CardDialog } from "./CardDialog";
import { Button } from "@/components/ui/button";

// §V.11 — case-insensitive match over card text + description.
function matchCard(card: Card, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    card.txt.toLowerCase().includes(needle) ||
    (card.desc?.toLowerCase().includes(needle) ?? false)
  );
}

export function Board({
  board,
  setBoard,
  query,
}: {
  board: BoardT;
  setBoard: (next: BoardT | ((p: BoardT) => BoardT)) => void;
  query: string;
}) {
  // §T18 — mouse drag (small distance) + touch drag (press-delay so a normal
  // scroll/tap on mobile doesn't start a drag). §V.5
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editing, setEditing] = useState<{ colId: string; card: Card } | null>(
    null
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function locate(cardId: string) {
    for (const c of board.cols) {
      const card = c.cards.find((cd) => cd.id === cardId);
      if (card) return { colId: c.id, card };
    }
    return null;
  }

  // visible (filtered) cards per column — drives both render and keyboard nav.
  const visible = board.cols.map((c) => ({
    col: c,
    cards: c.cards.filter((cd) => matchCard(cd, query)),
  }));

  function onDragStart(e: DragStartEvent) {
    const found = locate(String(e.active.id));
    setActiveCard(found?.card ?? null);
  }

  // §V.5 — drag-drop mutates state then setBoard->commit. DOM not authoritative.
  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const from = locate(String(active.id));
    if (!from) return;

    const overData = over.data.current as
      | { type?: string; colId?: string; cardId?: string }
      | undefined;

    let toCol: string;
    let toIndex: number;

    if (overData?.type === "col") {
      toCol = overData.colId!;
      toIndex = board.cols.find((c) => c.id === toCol)?.cards.length ?? 0;
    } else {
      const target = locate(String(over.id));
      if (!target) return;
      toCol = target.colId;
      const col = board.cols.find((c) => c.id === toCol)!;
      toIndex = col.cards.findIndex((c) => c.id === over.id);
      if (toIndex < 0) toIndex = col.cards.length;
    }

    if (from.colId === toCol && from.card.id === String(over.id)) return;
    setBoard((b) => moveCard(b, from.colId, toCol, from.card.id, toIndex));
  }

  // §T17 — keyboard nav. Arrows move focus, Enter edits, Del deletes, n adds.
  useEffect(() => {
    function focusCard(id: string | null) {
      setFocusedId(id);
      if (id) {
        requestAnimationFrame(() => {
          scrollRef.current
            ?.querySelector<HTMLElement>(`[data-card-id="${id}"]`)
            ?.focus();
        });
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (editing) return; // dialog owns the keyboard
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const cols = visible;
      const flatEmpty = cols.every((c) => c.cards.length === 0);

      // locate focused card position in the *visible* grid
      let ci = -1;
      let ri = -1;
      cols.forEach((c, i) => {
        const j = c.cards.findIndex((cd) => cd.id === focusedId);
        if (j >= 0) {
          ci = i;
          ri = j;
        }
      });

      const pick = (i: number, j: number) => {
        const col = cols[i];
        if (!col || col.cards.length === 0) return;
        const idx = Math.max(0, Math.min(j, col.cards.length - 1));
        focusCard(col.cards[idx].id);
      };

      switch (e.key) {
        case "ArrowDown":
          if (flatEmpty) return;
          e.preventDefault();
          if (ci < 0) pick(0, 0);
          else pick(ci, ri + 1);
          break;
        case "ArrowUp":
          if (flatEmpty) return;
          e.preventDefault();
          if (ci < 0) pick(0, 0);
          else pick(ci, ri - 1);
          break;
        case "ArrowRight": {
          if (ci < 0) return;
          e.preventDefault();
          for (let i = ci + 1; i < cols.length; i++) {
            if (cols[i].cards.length) {
              pick(i, ri);
              break;
            }
          }
          break;
        }
        case "ArrowLeft": {
          if (ci < 0) return;
          e.preventDefault();
          for (let i = ci - 1; i >= 0; i--) {
            if (cols[i].cards.length) {
              pick(i, ri);
              break;
            }
          }
          break;
        }
        case "Enter":
          if (ci >= 0) {
            e.preventDefault();
            setEditing({ colId: cols[ci].col.id, card: cols[ci].cards[ri] });
          }
          break;
        case "Delete":
        case "Backspace":
          if (ci >= 0) {
            e.preventDefault();
            const colId = cols[ci].col.id;
            const cardId = cols[ci].cards[ri].id;
            // move focus to a sensible neighbour before removal
            const nextCard =
              cols[ci].cards[ri + 1]?.id ?? cols[ci].cards[ri - 1]?.id ?? null;
            setBoard((b) => deleteCard(b, colId, cardId));
            focusCard(nextCard);
          }
          break;
        case "n":
        case "N": {
          e.preventDefault();
          const targetCol = ci >= 0 ? cols[ci].col.id : board.cols[0]?.id;
          if (targetCol) setBoard((b) => addCard(b, targetCol, "New card"));
          break;
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, visible, focusedId, editing, setBoard]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        ref={scrollRef}
        className="flex h-full items-start gap-3 overflow-x-auto p-3"
      >
        {visible.map(({ col, cards }) => (
          <Column
            key={col.id}
            col={col}
            cards={cards}
            filtered={!!query && cards.length !== col.cards.length}
            hiddenCount={col.cards.length - cards.length}
            focusedId={focusedId}
            onAddCard={(txt) => setBoard((b) => addCard(b, col.id, txt))}
            onEditCard={(card) => setEditing({ colId: col.id, card })}
            onDeleteCard={(cardId) =>
              setBoard((b) => deleteCard(b, col.id, cardId))
            }
            onRename={(name) => setBoard((b) => renameColumn(b, col.id, name))}
            onSetWip={(wip) => setBoard((b) => setColumnWip(b, col.id, wip))}
            onSetColor={(color) => setBoard((b) => setColumnColor(b, col.id, color))}
            onFocusCard={setFocusedId}
            onDelete={() => {
              if (
                col.cards.length === 0 ||
                window.confirm(`Delete column "${col.name}" and its cards?`)
              ) {
                setBoard((b) => deleteColumn(b, col.id));
              }
            }}
          />
        ))}

        <Button
          variant="outline"
          className="mt-1 shrink-0"
          onClick={() => setBoard((b) => addColumn(b, "New column"))}
        >
          <Plus size={16} /> Add column
        </Button>
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardItem
            card={activeCard}
            colId=""
            onEdit={() => {}}
            onDelete={() => {}}
            onFocus={() => {}}
          />
        ) : null}
      </DragOverlay>

      <CardDialog
        open={!!editing}
        card={editing?.card ?? null}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing)
            setBoard((b) =>
              updateCard(b, editing.colId, editing.card.id, patch)
            );
        }}
      />
    </DndContext>
  );
}
