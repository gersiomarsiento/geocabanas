"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    // If one is already open, treat it as cancelled
    resolveRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setRequest(options);
    });
  }, []);

  function close(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            {request.title && (
              <p className="text-base font-semibold text-zinc-900">
                {request.title}
              </p>
            )}
            <p className="mt-2 text-sm text-zinc-600">{request.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {request.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold hover:opacity-90 ${
                  request.destructive
                    ? "bg-red-600 text-white"
                    : "bg-foreground text-background"
                }`}
              >
                {request.confirmLabel ?? "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
