import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";
import { Col, Card } from "@/lib/board";
import { CardItem } from "./CardItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Column({
  col,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onRename,
  onDelete,
}: {
  col: Col;
  onAddCard: (txt: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingName, setEditingName] = useState(false);

  // empty-column drop target so cards can land in empty columns. §V.5
  const { setNodeRef } = useDroppable({
    id: `col-drop-${col.id}`,
    data: { type: "col", colId: col.id },
  });

  function commitAdd() {
    const t = draft.trim();
    if (t) onAddCard(t);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-[var(--color-col-bg)] p-2">
      <div className="mb-2 flex items-center gap-1">
        {editingName ? (
          <Input
            autoFocus
            defaultValue={col.name}
            onBlur={(e) => {
              onRename(e.target.value.trim() || col.name);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="h-7"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 truncate text-left text-sm font-semibold text-zinc-200"
            title="Click to rename"
          >
            {col.name}{" "}
            <span className="text-xs font-normal text-zinc-500">
              {col.cards.length}
            </span>
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete column"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-2 flex-1 flex-col gap-2 overflow-y-auto"
      >
        <SortableContext
          items={col.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {col.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              colId={col.id}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <div className="mt-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitAdd();
              }
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="Card text… (Enter to add)"
            className="w-full rounded-md border border-zinc-600 bg-zinc-800 p-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          />
          <div className="mt-1 flex gap-2">
            <Button size="sm" onClick={commitAdd}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft("");
                setAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 justify-start"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} /> Add card
        </Button>
      )}
    </div>
  );
}
