"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type RowProps = React.ComponentProps<"li"> & {
  left?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
};

function Row({ left, title, meta, right, disabled, className, ...props }: RowProps) {
  return (
    <li
      data-slot="row"
      className={cn(
        "grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-black py-3",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      <div className="flex size-6 items-center justify-center">{left}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        {meta && (
          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted">
            {meta}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center">{right}</div>}
    </li>
  );
}

type RowCheckboxProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function RowCheckbox({
  checked,
  onCheckedChange,
  className,
  ...props
}: RowCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex size-6 items-center justify-center border border-black bg-paper transition-transform duration-150 ease-pop active:scale-110",
        checked && "bg-neon",
        className
      )}
      {...props}
    >
      {checked && <Check className="size-4 stroke-[3] text-black" />}
    </button>
  );
}

type RowTagProps = React.ComponentProps<"span"> & {
  tone?: "default" | "positive" | "negative" | "night";
};

function RowTag({ tone = "default", className, ...props }: RowTagProps) {
  return (
    <span
      data-slot="row-tag"
      className={cn(
        "border border-black px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider",
        tone === "default" && "bg-paper text-black",
        tone === "positive" && "bg-neon text-black",
        tone === "negative" && "bg-black text-paper",
        tone === "night" && "bg-night text-paper",
        className
      )}
      {...props}
    />
  );
}

export { Row, RowCheckbox, RowTag };
