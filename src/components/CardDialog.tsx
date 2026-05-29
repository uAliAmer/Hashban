import { useEffect, useState } from "react";
import { Card } from "@/lib/board";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SWATCHES = [
  "",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

// §T8 — edit card meta: text, description, color label, due date.
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

  useEffect(() => {
    if (card) {
      setTxt(card.txt);
      setDesc(card.desc ?? "");
      setColor(card.color ?? "");
      setDue(card.due ?? "");
    }
  }, [card]);

  function save() {
    onSave({
      txt: txt.trim() || "Untitled",
      desc: desc.trim() || undefined,
      color: color || undefined,
      due: due || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">Edit card</h2>

      <label className="mb-1 block text-xs text-zinc-400">Title</label>
      <Textarea
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        autoFocus
        className="mb-3"
      />

      <label className="mb-1 block text-xs text-zinc-400">Description</label>
      <Textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="optional"
        className="mb-3"
      />

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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </Dialog>
  );
}
