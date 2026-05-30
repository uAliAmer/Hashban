import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";

type ConfirmState = {
  mode: "confirm";
  message: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
};

type AlertState = {
  mode: "alert";
  message: string;
  resolve: () => void;
};

type DialogState = ConfirmState | AlertState | null;

type ConfirmFn = (message: string, opts?: { danger?: boolean }) => Promise<boolean>;
type AlertFn = (message: string) => Promise<void>;

const ConfirmCtx = createContext<ConfirmFn>(() => Promise.resolve(false));
const AlertCtx = createContext<AlertFn>(() => Promise.resolve());

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmCtx);
}

export function useAlert(): AlertFn {
  return useContext(AlertCtx);
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  // stable ref so confirm/alert fns don't change identity
  const stateRef = useRef(state);
  stateRef.current = state;

  const confirm = useCallback<ConfirmFn>((message, opts = {}) => {
    return new Promise<boolean>((resolve) => {
      setState({ mode: "confirm", message, danger: opts.danger ?? false, resolve });
    });
  }, []);

  const alert = useCallback<AlertFn>((message) => {
    return new Promise<void>((resolve) => {
      setState({ mode: "alert", message, resolve });
    });
  }, []);

  function close() {
    setState(null);
  }

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

        {/* Confirm dialog */}
        {state?.mode === "confirm" && (
          <Dialog open onClose={() => handleConfirm(false)}>
            <p className="mb-5 text-sm text-zinc-200">{state.message}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => handleConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirm(true)}
                className={state.danger ? "bg-red-700 text-white hover:bg-red-600" : ""}
              >
                Confirm
              </Button>
            </div>
          </Dialog>
        )}

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
