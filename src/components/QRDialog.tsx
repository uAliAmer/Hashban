import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog } from "@/components/ui/dialog";

// §V.19 — QR generated client-side via qrcode lib. Zero external fetch (§V.6).
export function QRDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(window.location.href, {
      width: 240,
      margin: 1,
      color: { dark: "#e4e4e7", light: "#18181b" },
    }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="mb-3 text-sm font-semibold text-zinc-200">Scan to share</h2>
      <p className="mb-3 text-xs text-zinc-400">
        This QR code encodes the full board URL — scan it to open the board on another device.
      </p>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="QR code for current board URL"
          className="mx-auto rounded-md"
          width={240}
          height={240}
        />
      ) : (
        <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-500">
          Generating…
        </div>
      )}
      <p className="mt-3 break-all text-center text-[10px] text-zinc-600">
        {window.location.href.length > 80
          ? window.location.href.slice(0, 80) + "…"
          : window.location.href}
      </p>
    </Dialog>
  );
}
