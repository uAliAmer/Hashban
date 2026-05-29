import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn-pattern button (hand-rolled; no network init). Dark-theme tuned.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-900 hover:bg-white",
        secondary: "bg-zinc-700 text-zinc-100 hover:bg-zinc-600",
        ghost: "text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline:
          "border border-zinc-600 text-zinc-200 hover:bg-zinc-700",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 rounded-md px-2 text-xs",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
