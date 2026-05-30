import { useEffect, useRef, useState } from "react";
import { Card, CheckItem } from "@/lib/board";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { genId } from "@/lib/board";
import { Plus, Trash2 } from "lucide-react";

const SWATCHES = [
  "",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const PRIORITIES = [
  { value: "" as const, label: "None" },
  { value: "P1" as const, label: "P1", color: "bg-red-700 text-red-100" },
  { value: "P2" as const, label: "P2", color: "bg-orange-700 text-orange-100" },
  { value: "P3" as const, label: "P3", color: "bg-yellow-700 text-yellow-100" },
];

export function CardDialog({
  open,
  card,
  onClose,
  onSave,
}: {
  open: boolean;
  card: Card | null;
  onClose: () => void;
  onSave: (patch: Partial<Card>) => void;
}) {
  const [txt, setTxt] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<"" | "P1" | "P2" | "P3">("");
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);

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

      <label className="mb-1 block text-xs text-zinc-400">Label color</label>
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
