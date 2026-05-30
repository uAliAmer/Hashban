import { useRef, useState } from "react";
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
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Board as BoardT, Card, Lane } from "@/lib/board";
import {
  addCard,
  addLane,
  deleteCard,
  deleteLane,
  moveCard,
  renameLane,
  setCardLane,
  updateCard,
} from "@/lib/ops";
import { CardItem } from "./CardItem";
import { CardDialog } from "./CardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// §V.17 — cards without laneId belong to the first lane (implicit default)
function cardLaneId(card: Card, lanes: Lane[]): string {
  if (card.laneId && lanes.some((l) => l.id === card.laneId)) return card.laneId;
  return lanes[0]?.id ?? "";
}

function CellDropZone({
  colId,
  laneId,
  cards,
  filteredCards,
  filtered,
  focusedId,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onFocusCard,
}: {
  colId: string;
  laneId: string;
  cards: Card[];
  filteredCards: Card[];
  filtered: boolean;
  focusedId: string | null;
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onFocusCard: (id: string) => void;
}) {
  const droppableId = `cell-${colId}-${laneId}`;
  const { setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: "cell", colId, laneId },
  });

  const hiddenCount = cards.length - filteredCards.length;

  return (
    <div
      ref={setNodeRef}
      className="min-h-16 flex flex-col gap-1.5 p-1"
    >
      <SortableContext items={filteredCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {filteredCards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            colId={colId}
            focused={card.id === focusedId}
            onFocus={() => onFocusCard(card.id)}
            onEdit={() => onEditCard(card)}
            onDelete={() => onDeleteCard(card.id)}
          />
        ))}
      </SortableContext>
      {filtered && hiddenCount > 0 && (
        <div className="px-1 text-[11px] text-zinc-500">{hiddenCount} hidden</div>
      )}
      <button
        onClick={onAddCard}
        className="mt-0.5 rounded px-1 py-0.5 text-left text-xs text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
      >
        + add
      </button>
    </div>
  );
}

function LaneRow({
  lane,
  board,
  query,
  focusedId,
  onFocusCard,
  onEditCard,
  onAddCard,
  onDeleteCard,
  onRename,
  onDelete,
}: {
  lane: Lane;
  board: BoardT;
  query: string;
  focusedId: string | null;
  onFocusCard: (id: string) => void;
  onEditCard: (colId: string, card: Card) => void;
  onAddCard: (colId: string) => void;
  onDeleteCard: (colId: string, cardId: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const lanes = board.lanes ?? [];

  return (
    <tr className="border-b border-zinc-800">
      <td className="w-24 shrink-0 border-r border-zinc-800 bg-zinc-900 p-2 align-top">
        <div className="flex items-center gap-1">
          <GripVertical size={12} className="text-zinc-700" />
          {editingName ? (
            <Input
              autoFocus
              defaultValue={lane.name}
              className="h-6 text-xs"
              onBlur={(e) => {
                onRename(e.target.value.trim() || lane.name);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingName(false);
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex-1 truncate text-left text-xs font-medium text-zinc-300 hover:text-zinc-100"
              title="Rename lane"
            >
              {lane.name}
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-zinc-700 hover:text-red-400"
            aria-label="Delete lane"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
      {board.cols.map((col) => {
        const cellCards = col.cards.filter((cd) => cardLaneId(cd, lanes) === lane.id);
        const needle = query.toLowerCase();
        const filteredCards = query
          ? cellCards.filter(
              (cd) =>
                cd.txt.toLowerCase().includes(needle) ||
                (cd.desc?.toLowerCase().includes(needle) ?? false)
            )
          : cellCards;

        return (
          <td key={col.id} className="border-r border-zinc-800 align-top last:border-r-0">
            <CellDropZone
              colId={col.id}
              laneId={lane.id}
              cards={cellCards}
              filteredCards={filteredCards}
              filtered={!!query}
              focusedId={focusedId}
              onFocusCard={onFocusCard}
              onAddCard={() => onAddCard(col.id)}
              onEditCard={(card) => onEditCard(col.id, card)}
              onDeleteCard={(cardId) => onDeleteCard(col.id, cardId)}
            />
          </td>
        );
      })}
    </tr>
  );
}

export function SwimBoard({
  board,
  setBoard,
  query,
}: {
  board: BoardT;
  setBoard: (next: BoardT | ((p: BoardT) => BoardT)) => void;
  query: string;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editing, setEditing] = useState<{ colId: string; card: Card } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lanes = board.lanes ?? [];

  function locate(cardId: string): { colId: string; card: Card } | null {
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

  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const from = locate(String(active.id));
    if (!from) return;

    const overData = over.data.current as
      | { type?: string; colId?: string; laneId?: string; cardId?: string }
      | undefined;

    let toCol: string;
    let toLane: string | undefined;
    let toIndex: number;

    if (overData?.type === "cell") {
      toCol = overData.colId!;
      toLane = overData.laneId;
      toIndex = board.cols.find((c) => c.id === toCol)?.cards.filter(
        (cd) => cardLaneId(cd, lanes) === toLane
      ).length ?? 0;
    } else {
      const target = locate(String(over.id));
      if (!target) return;
      toCol = target.colId;
      toLane = target.card.laneId;
      const col = board.cols.find((c) => c.id === toCol)!;
      toIndex = col.cards.findIndex((c) => c.id === over.id);
      if (toIndex < 0) toIndex = col.cards.length;
    }

    const samePos = from.colId === toCol && from.card.id === String(over.id);
    if (samePos) return;

    setBoard((b) => {
      let next = moveCard(b, from.colId, toCol, from.card.id, toIndex);
      if (toLane !== undefined && toLane !== from.card.laneId) {
        next = setCardLane(next, toCol, from.card.id, toLane);
      }
      return next;
    });
  }

  function handleAddCardInLane(colId: string, laneId: string) {
    setBoard((b) => {
      let next = addCard(b, colId, "New card");
      const newCard = next.cols.find((c) => c.id === colId)?.cards.at(-1);
      if (newCard) next = setCardLane(next, colId, newCard.id, laneId);
      return next;
    });
  }

  const cn2 = cn; // alias to avoid shadowing

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div ref={scrollRef} className="overflow-auto p-3">
        <table className="border-collapse border border-zinc-800 text-sm">
          {/* Column headers */}
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="w-24 border-r border-zinc-800 bg-zinc-900 p-2 text-left text-xs font-medium text-zinc-500">
                Lane / Col
              </th>
              {board.cols.map((col) => (
                <th
                  key={col.id}
                  className="min-w-56 border-r border-zinc-800 p-2 text-left text-xs font-semibold text-zinc-200 last:border-r-0"
                  style={col.color ? { borderTop: `3px solid ${col.color}` } : undefined}
                >
                  {col.name}
                  <span className={cn2("ml-1.5 text-zinc-500 font-normal tabular-nums text-[10px]",
                    col.wip !== undefined && col.cards.length > col.wip ? "text-red-400" : "")}>
                    {col.cards.length}{col.wip !== undefined ? `/${col.wip}` : ""}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lanes.map((lane) => (
              <LaneRow
                key={lane.id}
                lane={lane}
                board={board}
                query={query}
                focusedId={focusedId}
                onFocusCard={setFocusedId}
                onEditCard={(colId, card) => setEditing({ colId, card })}
                onAddCard={(colId) => handleAddCardInLane(colId, lane.id)}
                onDeleteCard={(colId, cardId) => setBoard((b) => deleteCard(b, colId, cardId))}
                onRename={(name) => setBoard((b) => renameLane(b, lane.id, name))}
                onDelete={() => {
                  if (window.confirm(`Delete lane "${lane.name}"? Cards move to first lane.`))
                    setBoard((b) => deleteLane(b, lane.id));
                }}
              />
            ))}
          </tbody>
        </table>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setBoard((b) => addLane(b, "New lane"))}
        >
          <Plus size={14} /> Add lane
        </Button>
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} colId="" onEdit={() => {}} onDelete={() => {}} onFocus={() => {}} />
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
