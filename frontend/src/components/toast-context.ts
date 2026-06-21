import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastApi {
  show: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastApi | undefined>(undefined);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
