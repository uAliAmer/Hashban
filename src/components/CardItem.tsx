import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Label } from "@/lib/board";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE: Record<string, string> = {
  P1: "bg-red-700/80 text-red-100",
  P2: "bg-orange-700/80 text-orange-100",
  P3: "bg-yellow-700/80 text-yellow-100",
};

// readable text color (black/white) for a given hex bg — Trello-style label pills
function labelTextColor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#1a1a1a" : "#fff";
}

// §V.25 — label chips. labelText=true → text pill (Trello expanded), else color bar.
function LabelChips({ labels, labelText }: { labels: Label[]; labelText?: boolean }) {
  if (labels.length === 0) return null;
  return (
    <>
      {labels.map((lb) =>
        labelText ? (
          <span
            key={lb.id}
            className="shrink-0 truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
            style={{ background: lb.color, color: labelTextColor(lb.color), maxWidth: "8rem" }}
            title={lb.name}
          >
            {lb.name}
          </span>
        ) : (
          <span
            key={lb.id}
            className="h-2 w-7 shrink-0 rounded-full"
            style={{ background: lb.color }}
            title={lb.name}
          />
        )
      )}
    </>
  );
}

// Click card body → open edit. Click + drag → move card.
// moveRef tracks pointer displacement since last pointerdown;
// onClick only opens edit when movement was below drag threshold.
export function CardItem({
  card,
  colId,
  focused,
  compact,
  labels = [],
  labelText,
  onEdit,
  onDelete,
  onFocus,
}: {
  card: Card;
  colId: string;
  focused?: boolean;
  compact?: boolean;
  labels?: Label[];
  labelText?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onFocus: () => void;
}) {
  const moveRef = useRef(0);

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

  const checkTotal = card.checklist?.length ?? 0;
  const checkDone = card.checklist?.filter((i) => i.done).length ?? 0;

  // §V.25 — resolve this card's label ids against the board registry
  const cardLabels = card.labels?.length
    ? labels.filter((lb) => card.labels!.includes(lb.id))
    : [];

  // shared pointer tracking handlers
  const pointerHandlers = {
    onPointerDown: () => { moveRef.current = 0; },
    onPointerMove: (e: React.PointerEvent) => {
      moveRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    },
    onClick: () => { if (moveRef.current < 6) onEdit(); },
  };

  // §V.22 — compact view
  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        data-card-id={card.id}
        onFocus={onFocus}
        {...attributes}
        {...listeners}
        {...pointerHandlers}
        className={cn(
          "group relative flex cursor-pointer items-center gap-1.5 rounded border bg-[var(--color-card-bg)] px-2 py-1 text-xs focus:outline-none",
          focused ? "border-zinc-400 ring-1 ring-zinc-400" : "border-zinc-700 hover:border-zinc-500"
        )}
      >
        {card.color && (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: card.color }} />
        )}
        <LabelChips labels={cardLabels} labelText={labelText} />
        {card.priority && (
          <span className={cn("shrink-0 rounded px-1 text-[10px] font-semibold", PRIORITY_STYLE[card.priority])}>
            {card.priority}
          </span>
        )}
        <span className="flex-1 truncate text-zinc-200" dir="auto">{card.txt}</span>
        {checkTotal > 0 && (
          <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">{checkDone}/{checkTotal}</span>
        )}
        {card.due && (
          <span className={cn("shrink-0 rounded px-1 text-[10px]", overdue ? "text-red-300" : "text-zinc-500")}>
            {card.due}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete card"
        >
          <Trash2 size={11} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-card-id={card.id}
      onFocus={onFocus}
      {...attributes}
      {...listeners}
      {...pointerHandlers}
      className={cn(
        "group relative cursor-pointer rounded-md border bg-[var(--color-card-bg)] p-2 text-sm shadow-sm focus:outline-none",
        focused ? "border-zinc-400 ring-2 ring-zinc-400" : "border-zinc-700 hover:border-zinc-500"
      )}
    >
      {card.color && (
        <span className="absolute left-0 top-0 h-full w-1 rounded-l-md" style={{ background: card.color }} />
      )}

      {cardLabels.length > 0 && (
        <div className="mb-1 flex flex-wrap items-center gap-1 pl-1 pr-6">
          <LabelChips labels={cardLabels} labelText={labelText} />
        </div>
      )}

      <div className="flex items-start gap-1 pl-1 pr-6">
        <div className="flex-1 whitespace-pre-wrap break-words" dir="auto">{card.txt}</div>
        {card.priority && (
          <span className={cn("shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold", PRIORITY_STYLE[card.priority])}>
            {card.priority}
          </span>
        )}
      </div>

      {card.desc && (
        <div className="mt-1 line-clamp-2 pl-1 text-xs text-zinc-400" dir="auto">
          {card.desc}
        </div>
      )}

      {checkTotal > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-1">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-700">
            <div
              className="h-full rounded-full bg-zinc-400 transition-all"
              style={{ width: `${(checkDone / checkTotal) * 100}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-zinc-500">{checkDone}/{checkTotal}</span>
        </div>
      )}

      {card.due && (
        <div className={cn("mt-1 ml-1 inline-block rounded px-1.5 py-0.5 text-[10px]",
          overdue ? "bg-red-900/60 text-red-200" : "bg-zinc-700 text-zinc-300"
        )}>
          {card.due}
        </div>
      )}

      {/* drag hint + delete — shown on hover */}
      <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <GripVertical size={13} className="cursor-grab text-zinc-600 active:cursor-grabbing" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded p-0.5 text-zinc-600 hover:text-red-400"
          aria-label="Delete card"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
