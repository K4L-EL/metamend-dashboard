import { cn } from "../../lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

export function Loading({ className, size = "md" }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-[2px] border-border-strong border-t-accent",
          sizeMap[size],
        )}
      />
    </div>
  );
}
