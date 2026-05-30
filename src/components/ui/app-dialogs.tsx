import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Copy, Check } from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";

type ConfirmState = {
  mode: "confirm";
  message: string;
  danger: boolean;
  requireTyped?: string; // if set, user must type this word to enable Confirm
  resolve: (ok: boolean) => void;
};

type AlertState = {
  mode: "alert";
  message: string;
  resolve: () => void;
};

type DialogState = ConfirmState | AlertState | null;

type ConfirmOpts = { danger?: boolean; requireTyped?: string };
type ConfirmFn = (message: string, opts?: ConfirmOpts) => Promise<boolean>;
type AlertFn = (message: string) => Promise<void>;

const ConfirmCtx = createContext<ConfirmFn>(() => Promise.resolve(false));
const AlertCtx = createContext<AlertFn>(() => Promise.resolve());

export function useConfirm(): ConfirmFn { return useContext(ConfirmCtx); }
export function useAlert(): AlertFn { return useContext(AlertCtx); }

function TypedConfirmDialog({
  state,
  onConfirm,
  onCancel,
}: {
  state: ConfirmState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [wordCopied, setWordCopied] = useState(false);
  const word = state.requireTyped!;
  const match = typed === word;

  function copyWord() {
    navigator.clipboard.writeText(word).catch(() => {});
    setWordCopied(true);
    setTimeout(() => setWordCopied(false), 1500);
  }

  return (
    <Dialog open onClose={onCancel}>
      <p className="mb-4 text-sm text-zinc-200">{state.message}</p>

      {/* type-to-confirm row */}
      <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-400">
        <span>Type</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono font-semibold text-zinc-200">
          {word}
        </span>
        <span>to continue</span>
        <button
          onClick={copyWord}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Copy word"
          aria-label="Copy word"
        >
          {wordCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          <span className={`text-[10px] ${wordCopied ? "text-green-400" : ""}`}>
            {wordCopied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>

      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && match) onConfirm(); }}
        placeholder={word}
        className={`mb-4 w-full rounded-md border bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors ${
          typed.length > 0 && !match
            ? "border-red-700 focus:ring-red-700/50"
            : match
            ? "border-green-600 focus:ring-green-600/50"
            : "border-zinc-600 focus:ring-zinc-500"
        }`}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onConfirm}
          disabled={!match}
          className={`transition-all ${
            match
              ? state.danger
                ? "bg-red-700 text-white hover:bg-red-600"
                : ""
              : "cursor-not-allowed opacity-40"
          }`}
        >
          Confirm
        </Button>
      </div>
    </Dialog>
  );
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const confirm = useCallback<ConfirmFn>((message, opts = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({
        mode: "confirm",
        message,
        danger: opts.danger ?? false,
        requireTyped: opts.requireTyped,
        resolve,
      });
    });
  }, []);

  const alert = useCallback<AlertFn>((message) => {
    return new Promise<void>((resolve) => {
      setState({ mode: "alert", message, resolve });
    });
  }, []);

  function close() { setState(null); }

  function handleConfirm(ok: boolean) {
    if (state?.mode === "confirm") state.resolve(ok);
    close();
  }

  function handleAlert() {
    if (state?.mode === "alert") state.resolve();
    close();
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      <AlertCtx.Provider value={alert}>
        {children}

        {/* Confirm dialog — typed variant */}
        {state?.mode === "confirm" && state.requireTyped ? (
          <TypedConfirmDialog
            state={state}
            onConfirm={() => handleConfirm(true)}
            onCancel={() => handleConfirm(false)}
          />
        ) : state?.mode === "confirm" ? (
          <Dialog open onClose={() => handleConfirm(false)}>
            <p className="mb-5 text-sm text-zinc-200">{state.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => handleConfirm(false)}>Cancel</Button>
              <Button
                onClick={() => handleConfirm(true)}
                className={state.danger ? "bg-red-700 text-white hover:bg-red-600" : ""}
              >
                Confirm
              </Button>
            </div>
          </Dialog>
        ) : null}

        {/* Alert dialog */}
        {state?.mode === "alert" && (
          <Dialog open onClose={handleAlert}>
            <p className="mb-5 text-sm text-zinc-200">{state.message}</p>
            <div className="flex justify-end">
              <Button onClick={handleAlert}>OK</Button>
            </div>
          </Dialog>
        )}
      </AlertCtx.Provider>
    </ConfirmCtx.Provider>
  );
}
