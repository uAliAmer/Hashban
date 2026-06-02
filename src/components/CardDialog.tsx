import { useEffect, useRef, useState } from "react";
import { Card, CheckItem, Label, LABEL_COLORS } from "@/lib/board";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { genId } from "@/lib/board";
import { Check, Plus, Tag, Trash2 } from "lucide-react";

const SWATCHES = [
  "",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

// readable text color over a label color (matches CardItem pills)
function pillText(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#fff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#1a1a1a" : "#fff";
}

const PRIORITIES = [
  { value: "" as const, label: "None" },
  { value: "P1" as const, label: "P1", color: "bg-red-700 text-red-100" },
  { value: "P2" as const, label: "P2", color: "bg-orange-700 text-orange-100" },
  { value: "P3" as const, label: "P3", color: "bg-yellow-700 text-yellow-100" },
];

export function CardDialog({
  open,
  card,
  labels = [],
  onClose,
  onSave,
  onToggleLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: {
  open: boolean;
  card: Card | null;
  labels?: Label[];
  onClose: () => void;
  onSave: (patch: Partial<Card>) => void;
  onToggleLabel?: (labelId: string) => void;
  onCreateLabel?: (name: string, color: string) => void;
  onUpdateLabel?: (id: string, patch: Partial<Omit<Label, "id">>) => void;
  onDeleteLabel?: (id: string) => void;
}) {
  const [txt, setTxt] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<"" | "P1" | "P2" | "P3">("");
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);
  // §V.25 — label editor state
  const [labelEditId, setLabelEditId] = useState<string | null>(null);
  const [labelDraftName, setLabelDraftName] = useState("");
  const [labelDraftColor, setLabelDraftColor] = useState(LABEL_COLORS[0]);
  const [creatingLabel, setCreatingLabel] = useState(false);

  useEffect(() => {
    if (card) {
      setTxt(card.txt);
      setDesc(card.desc ?? "");
      setColor(card.color ?? "");
      setDue(card.due ?? "");
      setPriority(card.priority ?? "");
      setChecklist(card.checklist ? [...card.checklist] : []);
    }
  }, [card]);

  function addItem() {
    const t = newItem.trim();
    if (!t) return;
    setChecklist((prev) => [...prev, { id: genId(), txt: t, done: false }]);
    setNewItem("");
    newItemRef.current?.focus();
  }

  function save() {
    onSave({
      txt: txt.trim() || "Untitled",
      desc: desc.trim() || undefined,
      color: color || undefined,
      due: due || undefined,
      priority: priority || undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
    });
    onClose();
  }

  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">Edit card</h2>

      <label className="mb-1 block text-xs text-zinc-400">Title</label>
      <Textarea
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        autoFocus
        dir="auto"
        className="mb-3"
      />

      <label className="mb-1 block text-xs text-zinc-400">Description</label>
      <Textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="optional"
        dir="auto"
        className="mb-3"
      />

      {/* §V.25 — labels */}
      {onToggleLabel && (
        <>
          <label className="mb-1 flex items-center gap-1 text-xs text-zinc-400">
            <Tag size={11} /> Labels
          </label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {labels.map((lb) => {
              const active = card?.labels?.includes(lb.id);
              const editing = labelEditId === lb.id;
              if (editing) {
                return (
                  <div key={lb.id} className="flex w-full items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 p-1.5">
                    <Input
                      value={labelDraftName}
                      onChange={(e) => setLabelDraftName(e.target.value)}
                      placeholder="Label name"
                      className="h-6 flex-1 text-xs"
                      autoFocus
                    />
                    <div className="flex gap-0.5">
                      {LABEL_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setLabelDraftColor(c)}
                          className={`h-4 w-4 rounded-full border ${labelDraftColor === c ? "border-white" : "border-transparent"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <button onClick={() => { onUpdateLabel?.(lb.id, { name: labelDraftName.trim() || lb.name, color: labelDraftColor }); setLabelEditId(null); }}
                      className="rounded p-1 text-green-400 hover:bg-zinc-700" aria-label="Save label"><Check size={12} /></button>
                    <button onClick={() => { onDeleteLabel?.(lb.id); setLabelEditId(null); }}
                      className="rounded p-1 text-red-400 hover:bg-zinc-700" aria-label="Delete label"><Trash2 size={12} /></button>
                  </div>
                );
              }
              return (
                <div key={lb.id} className="group/lb relative">
                  <button
                    onClick={() => onToggleLabel(lb.id)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all"
                    style={{
                      background: active ? lb.color : `${lb.color}33`,
                      color: active ? "#fff" : lb.color,
                      outline: active ? `1px solid ${lb.color}` : "none",
                    }}
                  >
                    {active && <Check size={10} />}
                    {lb.name || "—"}
                  </button>
                  <button
                    onClick={() => { setLabelEditId(lb.id); setLabelDraftName(lb.name); setLabelDraftColor(lb.color); }}
                    className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-900 text-[8px] leading-none text-zinc-400 group-hover/lb:flex hover:text-zinc-100"
                    aria-label="Edit label"
                  >
                    ✎
                  </button>
                </div>
              );
            })}

            {creatingLabel ? (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 p-2">
                {/* live preview pill */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: labelDraftColor, color: pillText(labelDraftColor) }}
                  >
                    {labelDraftName.trim() || "Label preview"}
                  </span>
                </div>
                <Input
                  value={labelDraftName}
                  onChange={(e) => setLabelDraftName(e.target.value)}
                  placeholder="Label name"
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    // Enter adds and keeps the form open for rapid entry; Escape closes
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onCreateLabel?.(labelDraftName.trim() || "Label", labelDraftColor);
                      setLabelDraftName("");
                    }
                    if (e.key === "Escape") setCreatingLabel(false);
                  }}
                />
                <div className="mt-2 grid grid-cols-10 gap-1">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setLabelDraftColor(c)}
                      aria-label={`Color ${c}`}
                      className={`h-5 w-full rounded ${labelDraftColor === c ? "ring-2 ring-white" : "ring-1 ring-black/20"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setCreatingLabel(false)}
                    className="rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => { onCreateLabel?.(labelDraftName.trim() || "Label", labelDraftColor); setLabelDraftName(""); }}
                    className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
                  >
                    <Plus size={11} /> Add label
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setCreatingLabel(true); setLabelDraftName(""); setLabelDraftColor(LABEL_COLORS[0]); }}
                className="flex items-center gap-1 rounded border border-dashed border-zinc-600 px-2 py-1 text-[11px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-300"
              >
                <Plus size={11} /> New label
              </button>
            )}
          </div>
        </>
      )}

      {/* §V.16 — priority */}
      <label className="mb-1 block text-xs text-zinc-400">Priority</label>
      <div className="mb-3 flex gap-1.5">
        {PRIORITIES.map((p) => (
          <button
            key={p.value || "none"}
            onClick={() => setPriority(p.value)}
            className={`rounded px-2 py-0.5 text-xs font-medium border-2 ${
              priority === p.value
                ? "border-white " + (p.color ?? "bg-zinc-700 text-zinc-200")
                : "border-transparent " + (p.color ?? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs text-zinc-400">Card color</label>
      <div className="mb-3 flex gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c || "none"}
            onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full border-2 ${
              color === c ? "border-white" : "border-transparent"
            }`}
            style={{ background: c || "transparent" }}
            aria-label={c ? `color ${c}` : "no color"}
          >
            {!c && <span className="text-xs text-zinc-500">∅</span>}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs text-zinc-400">Due date</label>
      <Input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="mb-4"
      />

      {/* §V.14 — checklist */}
      <label className="mb-1 block text-xs text-zinc-400">
        Checklist{checklist.length > 0 ? ` (${doneCount}/${checklist.length})` : ""}
      </label>
      <div className="mb-2 flex flex-col gap-1">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() =>
                setChecklist((prev) =>
                  prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i)
                )
              }
              className="accent-zinc-400"
            />
            <input
              value={item.txt}
              onChange={(e) =>
                setChecklist((prev) =>
                  prev.map((i) => i.id === item.id ? { ...i, txt: e.target.value } : i)
                )
              }
              dir="auto"
              className={`flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none ${
                item.done ? "line-through text-zinc-500" : ""
              }`}
            />
            <button
              onClick={() =>
                setChecklist((prev) => prev.filter((i) => i.id !== item.id))
              }
              className="text-zinc-600 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-1.5">
        <Input
          ref={newItemRef}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addItem(); }
          }}
          placeholder="Add item…"
          className="h-7 text-xs"
        />
        <Button size="sm" variant="ghost" onClick={addItem}>
          <Plus size={13} />
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </Dialog>
  );
}
