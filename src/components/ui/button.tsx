import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-neutral-900 text-white shadow-md hover:bg-neutral-800 active:bg-neutral-950",
  secondary:
    "bg-white text-neutral-600 ring-1 ring-inset ring-neutral-300 shadow-sm hover:bg-neutral-50 hover:ring-neutral-400",
  ghost:
    "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
  danger:
    "bg-neutral-800 text-white shadow-md hover:bg-neutral-700 active:bg-neutral-900",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-9 px-4 text-[13px]",
  lg: "h-10 px-5 text-sm",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
