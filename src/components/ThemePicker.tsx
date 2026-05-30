import { useEffect, useRef, useState } from "react";
import { Paintbrush } from "lucide-react";
import { THEMES, getSavedThemeId, saveThemeId, applyTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(getSavedThemeId);
  const ref = useRef<HTMLDivElement>(null);

  // apply saved theme on mount
  useEffect(() => {
    const theme = THEMES.find((t) => t.id === activeId) ?? THEMES[0];
    applyTheme(theme);
  }, []);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(id: string) {
    const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
    applyTheme(theme);
    saveThemeId(id);
    setActiveId(id);
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        title="Background theme"
        aria-label="Background theme"
        onClick={() => setOpen((v) => !v)}
        className={open ? "text-blue-400" : ""}
      >
        <Paintbrush size={16} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Background
          </p>

          {/* 3 × 3 swatch grid */}
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                title={theme.label}
                onClick={() => pick(theme.id)}
                className="group flex flex-col items-center gap-1"
              >
                <span
                  className={`block h-12 w-full rounded-lg border-2 transition-all ${
                    activeId === theme.id
                      ? "border-white shadow-lg shadow-white/20 scale-95"
                      : "border-zinc-500 hover:border-zinc-300 hover:scale-95"
                  }`}
                  style={{ background: theme.preview }}
                />
                <span className={`text-[10px] font-medium ${activeId === theme.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                  {theme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
