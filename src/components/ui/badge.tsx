
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-supabase-green text-supabase-darker",
        secondary:
          "border-transparent bg-supabase-indigo text-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-supabase-border",
        info: "border-transparent bg-blue-500 text-white",
        warning: "border-transparent bg-amber-500 text-supabase-darker",
        success: "border-transparent bg-supabase-green text-supabase-darker",
        error: "border-transparent bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
