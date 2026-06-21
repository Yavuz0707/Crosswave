import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fieldLabelStyle, FormError } from "./FormError";
import { Spinner } from "./Spinner";

interface FormModalProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  /** Resolve to close; throw an Error to show its message inline. */
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}

export function FormModal({
  open,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  onSubmit,
  onClose,
}: FormModalProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError(`${label} is required.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgba(43,36,34,.42)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="cw-card"
            style={{ width: "100%", maxWidth: 440, padding: 26, boxShadow: "var(--shadow-lg)" }}
          >
            <h2
              style={{
                margin: "0 0 4px",
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink-900)",
                letterSpacing: "-.01em",
              }}
            >
              {title}
            </h2>
            {description && (
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {description}
              </p>
            )}
            <form onSubmit={handleSubmit} style={{ marginTop: description ? 0 : 18 }}>
              <label style={fieldLabelStyle}>{label}</label>
              <input
                className="cw-input"
                autoFocus
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ marginBottom: 16 }}
              />
              {error && <FormError message={error} />}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="cw-btn-secondary"
                  style={{ height: 42, padding: "0 18px" }}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cw-btn-accent"
                  style={{ height: 42, padding: "0 20px" }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Spinner size={17} color="var(--text-on-accent)" />
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
