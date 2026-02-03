import { useEffect, useRef } from "react";

/**
 * Renders a full-screen animated particle ring using CSS Houdini paint worklet.
 * Follows pointer to simulate "gravitational" motion.
 */
export function FloatingBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof CSS === "undefined" || !("paintWorklet" in CSS)) {
      return;
    }

    // Load the ring particles paint worklet
    try {
      // @ts-ignore
      CSS.paintWorklet.addModule(
        "https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js"
      );
    } catch (err) {
      console.warn("PaintWorklet unavailable", err);
      return;
    }

    const handleMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el.style.setProperty("--ring-x", `${x}`);
      el.style.setProperty("--ring-y", `${y}`);
      el.style.setProperty("--ring-interactive", "1");
    };

    const handleLeave = () => {
      el.style.setProperty("--ring-x", "50");
      el.style.setProperty("--ring-y", "50");
      el.style.setProperty("--ring-interactive", "0");
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return <div ref={ref} className="gravity-bg" aria-hidden="true" />;
}
