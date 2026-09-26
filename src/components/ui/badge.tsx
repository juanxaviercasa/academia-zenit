import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600/90 text-white shadow hover:bg-indigo-600",
        secondary:
          "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
        outline:
          "border-slate-700 text-slate-300 hover:bg-slate-800",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
        math:
          "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
        science:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
        humanities:
          "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
        free:
          "border-emerald-500/40 bg-emerald-950/70 text-emerald-300 font-medium",
        level:
          "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.2",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
