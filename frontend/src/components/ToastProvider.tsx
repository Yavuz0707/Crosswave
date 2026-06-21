import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToastContext, type ToastType } from "./toast-context";
import { IconAlert, IconBell, IconCheck } from "./Icons";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const TONE: Record<
  ToastType,
  { bg: string; border: string; color: string; icon: typeof IconCheck }
> = {
  success: {
    bg: "var(--positive-soft)",
    border: "#CFE3D6",
    color: "var(--green-700)",
    icon: IconCheck,
  },
  error: {
    bg: "var(--negative-soft)",
    border: "#F0CFCC",
    color: "var(--red-700)",
    icon: IconAlert,
  },
  info: {
    bg: "var(--accent-soft)",
    border: "var(--accent-soft-2)",
    color: "var(--accent)",
    icon: IconBell,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => remove(id), 3600);
    },
    [remove],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 360,
        }}
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const tone = TONE[t.type];
            const Icon = tone.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={() => remove(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-card)",
                  border: `1px solid ${tone.border}`,
                  boxShadow: "var(--shadow-lg)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    flex: "none",
                    borderRadius: "var(--radius-full)",
                    background: tone.bg,
                    color: tone.color,
                  }}
                >
                  <Icon size={15} color={tone.color} />
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                  }}
                >
                  {t.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
