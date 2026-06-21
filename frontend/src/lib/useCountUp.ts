import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` once (and on target change) using
 * requestAnimationFrame with an ease-out curve. Respects reduced motion.
 */
export function useCountUp(target: number, durationMs = 1000): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(target * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}
