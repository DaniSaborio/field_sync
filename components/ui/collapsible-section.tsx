"use client";

import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  icon?: LucideIcon;
  label: string;
  defaultOpen?: boolean;
  summary?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

function CollapsibleSection({
  icon: Icon,
  label,
  defaultOpen = false,
  summary,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border border-black bg-paper shadow-hard", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <span className="flex shrink-0 items-center gap-1.5">
          {Icon ? <Icon size={14} strokeWidth={2} aria-hidden /> : null}
          <span className="bg-black px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
            {label}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          {!open && summary ? (
            <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted">
              {summary}
            </span>
          ) : null}
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={cn("shrink-0 transition-transform duration-150 ease-pop", open && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {open ? <div className="space-y-4 border-t border-black p-4">{children}</div> : null}
    </div>
  );
}

export { CollapsibleSection };
