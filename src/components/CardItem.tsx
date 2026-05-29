import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/lib/board";
import { cn } from "@/lib/utils";

export function CardItem({
  card,
  colId,
  onEdit,
  onDelete,
}: {
  card: Card;
  colId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", colId, cardId: card.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue =
    card.due && new Date(card.due) < new Date(new Date().toDateString());

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-md border border-zinc-700 bg-[var(--color-card-bg)] p-2 pl-6 text-sm shadow-sm"
    >
      {card.color && (
        <span
          className="absolute left-0 top-0 h-full w-1 rounded-l-md"
          style={{ background: card.color }}
        />
      )}
      <button
        className="absolute left-1 top-1.5 cursor-grab text-zinc-500 opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
        aria-label="Drag card"
      >
        <GripVertical size={14} />
      </button>

      <div className="whitespace-pre-wrap break-words pr-10">{card.txt}</div>

      {card.desc && (
        <div className="mt-1 line-clamp-2 text-xs text-zinc-400">
          {card.desc}
        </div>
      )}
      {card.due && (
        <div
          className={cn(
            "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]",
            overdue
              ? "bg-red-900/60 text-red-200"
              : "bg-zinc-700 text-zinc-300"
          )}
        >
          {card.due}
        </div>
      )}

      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
          aria-label="Edit card"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-red-300"
          aria-label="Delete card"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
