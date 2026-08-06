import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border border-black font-mono text-xs font-black uppercase tracking-wider transition-transform duration-150 ease-pop disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-neon text-black shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm",
        secondary:
          "bg-paper text-black shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm",
        destructive:
          "bg-black text-paper shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm",
        ghost: "border-transparent bg-transparent text-black",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3",
        sm: "h-11 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
