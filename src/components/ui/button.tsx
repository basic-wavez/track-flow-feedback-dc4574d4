
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-supabase-pink text-supabase-darker hover:bg-supabase-pink/90",
        destructive:
          "bg-red-500 text-white hover:bg-red-600", // Updated to a lighter, more visible red
        outline:
          "border border-input bg-transparent hover:bg-accent/10 hover:text-accent",
        secondary:
          "bg-supabase-indigo text-white hover:bg-supabase-indigo/80",
        ghost: "hover:bg-accent/10 hover:text-accent",
        link: "text-supabase-pink underline-offset-4 hover:underline",
        yellow: "bg-supabase-yellow text-supabase-darker hover:bg-supabase-yellow/90",
      },
      size: {
        default: "h-8 px-4 py-1.5",
        sm: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-9 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
