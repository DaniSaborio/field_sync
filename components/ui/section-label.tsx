import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionLabelProps = React.ComponentProps<"div"> & {
  icon?: LucideIcon;
};

function SectionLabel({ icon: Icon, children, className, ...props }: SectionLabelProps) {
  return (
    <div
      data-slot="section-label"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    >
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden />}
      <span className="bg-black px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-paper">
        {children}
      </span>
    </div>
  );
}

export { SectionLabel };
