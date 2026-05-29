import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
  updateCard,
} from "@/lib/ops";
import { Column } from "./Column";
import { CardItem } from "./CardItem";
import { CardDialog } from "./CardDialog";
import { Button } from "@/components/ui/button";

export function Board({
  board,
  setBoard,
}: {
  board: BoardT;
  setBoard: (next: BoardT | ((p: BoardT) => BoardT)) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editing, setEditing] = useState<{ colId: string; card: Card } | null>(
    null
  );

  function locate(cardId: string) {
    for (const c of board.cols) {
      const card = c.cards.find((cd) => cd.id === cardId);
      if (card) return { colId: c.id, card };
    }
    return null;
  }

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
      // dropped on empty column area
      toCol = overData.colId!;
      toIndex = board.cols.find((c) => c.id === toCol)?.cards.length ?? 0;
    } else {
      // dropped over another card
      const target = locate(String(over.id));
      if (!target) return;
      toCol = target.colId;
      const col = board.cols.find((c) => c.id === toCol)!;
      toIndex = col.cards.findIndex((c) => c.id === over.id);
      if (toIndex < 0) toIndex = col.cards.length;
    }

    if (from.colId === toCol && from.card.id === String(over.id)) return;
    setBoard((b) =>
      moveCard(b, from.colId, toCol, from.card.id, toIndex)
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full items-start gap-3 overflow-x-auto p-3">
        {board.cols.map((col) => (
          <Column
            key={col.id}
            col={col}
            onAddCard={(txt) => setBoard((b) => addCard(b, col.id, txt))}
            onEditCard={(card) => setEditing({ colId: col.id, card })}
            onDeleteCard={(cardId) =>
              setBoard((b) => deleteCard(b, col.id, cardId))
            }
            onRename={(name) => setBoard((b) => renameColumn(b, col.id, name))}
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
