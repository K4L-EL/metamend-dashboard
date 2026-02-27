import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-muted-light">{icon}</div>}
      <h3 className="text-[13px] font-medium text-secondary">{title}</h3>
      {description && (
        <p className="mt-1.5 text-[12px] text-muted">{description}</p>
      )}
    </div>
  );
}
