import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Database, GitBranch, Zap, FileOutput } from "lucide-react";
import { cn } from "../../lib/utils";

interface FlowNodeData {
  label: string;
  nodeKind: "source" | "transform" | "output";
  config: Record<string, string>;
}

const KIND_STYLES = {
  source: {
    border: "border-neutral-400",
    bg: "bg-neutral-100",
    icon: "bg-neutral-200 text-neutral-700",
    accent: "bg-neutral-600",
    handle: "#404040",
  },
  transform: {
    border: "border-neutral-400",
    bg: "bg-neutral-100",
    icon: "bg-neutral-200 text-neutral-700",
    accent: "bg-neutral-600",
    handle: "#525252",
  },
  output: {
    border: "border-neutral-400",
    bg: "bg-neutral-100",
    icon: "bg-neutral-200 text-neutral-700",
    accent: "bg-neutral-600",
    handle: "#737373",
  },
} as const;

const KIND_ICONS = {
  source: Database,
  transform: GitBranch,
  output: FileOutput,
} as const;

export const FlowNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as FlowNodeData;
  const kind = nodeData.nodeKind ?? "transform";
  const style = KIND_STYLES[kind];
  const Icon = KIND_ICONS[kind];
  const config = nodeData.config ?? {};
  const entries = Object.entries(config).slice(0, 3);

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border bg-white shadow-lg shadow-black/4",
        style.border,
      )}
    >
      {kind !== "source" && (
        <Handle
          type="target"
          position={Position.Left}
          className="h-2.5! w-2.5! rounded-full! border-2! border-white!"
          style={{ background: style.handle }}
        />
      )}

      <div className={cn("flex items-center gap-2.5 rounded-t-xl px-3.5 py-2.5", style.bg)}>
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", style.icon)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[12px] font-semibold text-gray-900">{nodeData.label}</p>
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{kind}</p>
        </div>
        <div className={cn("h-1.5 w-1.5 rounded-full", style.accent)} />
      </div>

      {entries.length > 0 && (
        <div className="space-y-1 px-3.5 py-2.5">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-400">{key}</span>
              <span className="truncate text-[10px] font-medium text-gray-600">{value}</span>
            </div>
          ))}
        </div>
      )}

      {kind !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          className="h-2.5! w-2.5! rounded-full! border-2! border-white!"
          style={{ background: style.handle }}
        />
      )}
    </div>
  );
});

FlowNode.displayName = "FlowNode";
