import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/ui/app-dialogs";
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
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Board as BoardT, Card, Col } from "@/lib/board";
import {
  addCard,
  addColumn,
  deleteCard,
  deleteColumn,
  moveCard,
  moveColumn,
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
  compact,
}: {
  board: BoardT;
  setBoard: (next: BoardT | ((p: BoardT) => BoardT)) => void;
  query: string;
  compact: boolean;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const confirm = useConfirm();
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeCol, setActiveCol] = useState<Col | null>(null);
  const [editing, setEditing] = useState<{ colId: string; card: Card } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // §V.23 — collapsed cols: ephemeral, not in hash
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  function toggleCollapse(colId: string) {
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }

  function locate(cardId: string) {
    for (const c of board.cols) {
      const card = c.cards.find((cd) => cd.id === cardId);
      if (card) return { colId: c.id, card };
    }
    return null;
  }

  const visible = board.cols.map((c) => ({
    col: c,
    cards: c.cards.filter((cd) => matchCard(cd, query)),
  }));

  function onDragStart(e: DragStartEvent) {
    const type = (e.active.data.current as { type?: string })?.type;
    if (type === "column") {
      const col = board.cols.find((c) => c.id === String(e.active.id));
      setActiveCol(col ?? null);
    } else {
      const found = locate(String(e.active.id));
      setActiveCard(found?.card ?? null);
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const wasCol = !!activeCol;
    setActiveCard(null);
    setActiveCol(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    // §V.20 — column reorder.
    // over.id can be: column id (correct), "col-drop-<id>" (card droppable),
    // or a card id — resolve all three to a column id.
    if (wasCol) {
      const overId = String(over.id);
      let targetColId: string | undefined;

      if (board.cols.some((c) => c.id === overId)) {
        targetColId = overId;
      } else if (overId.startsWith("col-drop-")) {
        targetColId = overId.replace("col-drop-", "");
      } else {
        // overId is a card id — find which column owns it
        for (const c of board.cols) {
          if (c.cards.some((cd) => cd.id === overId)) {
            targetColId = c.id;
            break;
          }
        }
      }

      const fromIdx = board.cols.findIndex((c) => c.id === String(active.id));
      const toIdx = board.cols.findIndex((c) => c.id === targetColId);
      if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
        setBoard((b) => moveColumn(b, fromIdx, toIdx));
      }
      return;
    }

    // card move/reorder
    const from = locate(String(active.id));
    if (!from) return;

    const overData = over.data.current as
      | { type?: string; colId?: string }
      | undefined;

    let toCol: string;
    let toIndex: number;

    if (overData?.type === "col") {
      toCol = overData.colId!;
      toIndex = board.cols.find((c) => c.id === toCol)?.cards.length ?? 0;
    } else if (overData?.type === "column") {
      // dropped card onto column header — skip
      return;
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

  // §T17 — keyboard nav
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
      if (editing) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const cols = visible;
      const flatEmpty = cols.every((c) => c.cards.length === 0);

      let ci = -1;
      let ri = -1;
      cols.forEach((c, i) => {
        const j = c.cards.findIndex((cd) => cd.id === focusedId);
        if (j >= 0) { ci = i; ri = j; }
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
          if (ci < 0) pick(0, 0); else pick(ci, ri + 1);
          break;
        case "ArrowUp":
          if (flatEmpty) return;
          e.preventDefault();
          if (ci < 0) pick(0, 0); else pick(ci, ri - 1);
          break;
        case "ArrowRight": {
          if (ci < 0) return;
          e.preventDefault();
          for (let i = ci + 1; i < cols.length; i++) {
            if (cols[i].cards.length) { pick(i, ri); break; }
          }
          break;
        }
        case "ArrowLeft": {
          if (ci < 0) return;
          e.preventDefault();
          for (let i = ci - 1; i >= 0; i--) {
            if (cols[i].cards.length) { pick(i, ri); break; }
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
            const nextCard = cols[ci].cards[ri + 1]?.id ?? cols[ci].cards[ri - 1]?.id ?? null;
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
      {/* §V.20 — SortableContext for column reorder */}
      <SortableContext
        items={board.cols.map((c) => c.id)}
        strategy={horizontalListSortingStrategy}
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
              compact={compact}
              collapsed={collapsedCols.has(col.id)}
              onToggleCollapse={() => toggleCollapse(col.id)}
              onAddCard={(txt) => setBoard((b) => addCard(b, col.id, txt))}
              onEditCard={(card) => setEditing({ colId: col.id, card })}
              onDeleteCard={(cardId) => setBoard((b) => deleteCard(b, col.id, cardId))}
              onRename={(name) => setBoard((b) => renameColumn(b, col.id, name))}
              onSetWip={(wip) => setBoard((b) => setColumnWip(b, col.id, wip))}
              onSetColor={(color) => setBoard((b) => setColumnColor(b, col.id, color))}
              onFocusCard={setFocusedId}
              onDelete={async () => {
                if (
                  col.cards.length === 0 ||
                  await confirm(`Delete column "${col.name}" and all its cards?`, { danger: true })
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
      </SortableContext>

      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} colId="" onEdit={() => {}} onDelete={() => {}} onFocus={() => {}} />
        ) : activeCol ? (
          <div className="w-72 rounded-lg border border-zinc-600 bg-zinc-800 p-2 opacity-90 shadow-xl">
            <div className="text-sm font-semibold text-zinc-200">{activeCol.name}</div>
          </div>
        ) : null}
      </DragOverlay>

      <CardDialog
        open={!!editing}
        card={editing?.card ?? null}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) setBoard((b) => updateCard(b, editing.colId, editing.card.id, patch));
        }}
      />
    </DndContext>
  );
}
