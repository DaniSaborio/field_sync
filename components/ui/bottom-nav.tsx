import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type BottomNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

type BottomNavProps = React.ComponentProps<"nav"> & {
  home: BottomNavItem;
  action: BottomNavItem;
  stats: BottomNavItem;
};

function BottomNav({ home, action, stats, className, ...props }: BottomNavProps) {
  const ActionIcon = action.icon;

  return (
    <nav
      data-slot="bottom-nav"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around border-t border-black bg-paper px-4",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      {...props}
    >
      <BottomNavLink item={home} />

      <a
        href={action.href}
        aria-label={action.label}
        className="flex size-14 -translate-y-3 items-center justify-center border border-black bg-neon shadow-hard transition-transform duration-150 ease-pop active:translate-x-[2px] active:translate-y-[calc(2px-0.75rem)] active:shadow-hard-sm"
      >
        <ActionIcon size={22} strokeWidth={2} className="text-black" aria-hidden />
      </a>

      <BottomNavLink item={stats} />
    </nav>
  );
}

function BottomNavLink({ item }: { item: BottomNavItem }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1",
        item.active ? "font-semibold opacity-100" : "font-normal opacity-60"
      )}
    >
      <Icon size={20} strokeWidth={item.active ? 2.5 : 2} aria-hidden />
      <span className="font-mono text-[10px] uppercase tracking-wider">
        {item.label}
      </span>
    </a>
  );
}

export { BottomNav };
