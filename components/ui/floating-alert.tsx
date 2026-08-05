"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FloatingAlertProps = {
  message: string;
  variant?: "default" | "negative";
  duration?: number;
  onDismiss?: () => void;
  className?: string;
};

function FloatingAlert({
  message,
  variant = "default",
  duration = 4000,
  onDismiss,
  className,
}: FloatingAlertProps) {
  const [entered, setEntered] = React.useState(false);
  const isNegative = variant === "negative";

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    if (!onDismiss) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      data-slot="floating-alert"
      role={isNegative ? "alert" : "status"}
      aria-live={isNegative ? "assertive" : "polite"}
      className={cn(
        "fixed right-6 z-50 border border-black px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider shadow-hard transition-all duration-300 ease-pop",
        entered ? "scale-100 opacity-100" : "scale-90 opacity-0",
        isNegative ? "bg-black text-paper" : "bg-neon text-black",
        className
      )}
      style={{ bottom: "110px" }}
    >
      {message}
    </div>
  );
}

export { FloatingAlert };
