import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressBarProps = React.ComponentProps<"div"> & {
  /** 0–100 */
  value: number;
};

function ProgressBar({ value, className, ...props }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="progress-bar"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full border border-black bg-paper", className)}
      {...props}
    >
      <div
        className="h-full bg-neon transition-[width] duration-[600ms] ease-pop"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { ProgressBar };
