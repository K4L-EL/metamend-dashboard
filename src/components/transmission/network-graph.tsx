import { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "../../lib/utils";
import type { TransmissionNetwork, TransmissionNode, TransmissionLink } from "../../types";

interface NetworkGraphProps {
  network: TransmissionNetwork;
  onSelectNode?: (node: TransmissionNode | null) => void;
}

const NODE_STYLES: Record<string, { bg: string; border: string; ring: string; text: string }> = {
  Index: { bg: "#fef2f2", border: "#dc2626", ring: "#dc2626", text: "#991b1b" },
  Secondary: { bg: "#fffbeb", border: "#d97706", ring: "#d97706", text: "#92400e" },
  Environmental: { bg: "#f0fdfa", border: "#0d9488", ring: "#0d9488", text: "#134e4a" },
  HCW: { bg: "#eff6ff", border: "#3b82f6", ring: "#3b82f6", text: "#1e40af" },
  "Suspected Source": { bg: "#faf5ff", border: "#a855f7", ring: "#a855f7", text: "#6b21a8" },
};

const LINK_COLORS: Record<string, string> = {
  "Direct Contact": "#dc2626",
  "Shared Equipment": "#d97706",
  "Ward Proximity": "#0d9488",
  "Temporal Link": "#3b82f6",
  "Environmental": "#16a34a",
};

function radialLayout(nodes: TransmissionNode[], links: TransmissionLink[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const indexNodes = nodes.filter((n) => n.nodeType === "Index");
  const otherNodes = nodes.filter((n) => n.nodeType !== "Index");

  const centerX = 400;
  const centerY = 300;

  // Place index nodes at center
  indexNodes.forEach((n, i) => {
    const offset = indexNodes.length > 1 ? (i - (indexNodes.length - 1) / 2) * 120 : 0;
    positions.set(n.id, { x: centerX + offset, y: centerY });
  });

  // Group remaining by connection depth
  const directlyConnected = new Set<string>();
  const indirectlyConnected = new Set<string>();

  for (const link of links) {
    const srcIsIndex = indexNodes.some((n) => n.id === link.sourceId);
    const tgtIsIndex = indexNodes.some((n) => n.id === link.targetId);
    if (srcIsIndex) directlyConnected.add(link.targetId);
    if (tgtIsIndex) directlyConnected.add(link.sourceId);
  }

  for (const node of otherNodes) {
    if (!directlyConnected.has(node.id)) {
      indirectlyConnected.add(node.id);
    }
  }

  // Inner ring: directly connected
  const ring1 = otherNodes.filter((n) => directlyConnected.has(n.id));
  const ring1Radius = 220;
  ring1.forEach((n, i) => {
    const angle = (i / ring1.length) * 2 * Math.PI - Math.PI / 2;
    positions.set(n.id, {
      x: centerX + Math.cos(angle) * ring1Radius,
      y: centerY + Math.sin(angle) * ring1Radius,
    });
  });

  // Outer ring: indirectly connected
  const ring2 = otherNodes.filter((n) => indirectlyConnected.has(n.id));
  const ring2Radius = 380;
  ring2.forEach((n, i) => {
    const angle = (i / Math.max(ring2.length, 1)) * 2 * Math.PI - Math.PI / 4;
    positions.set(n.id, {
      x: centerX + Math.cos(angle) * ring2Radius,
      y: centerY + Math.sin(angle) * ring2Radius,
    });
  });

  return positions;
}

function TransmissionNodeComponent({ data }: NodeProps) {
  const d = data as unknown as { transmissionNode: TransmissionNode };
  const node = d.transmissionNode;
  const style = NODE_STYLES[node.nodeType] ?? NODE_STYLES["Suspected Source"]!;

  return (
    <div
      className="relative cursor-pointer"
      style={{ minWidth: 160 }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0! h-1! w-1!" />
      <Handle type="source" position={Position.Bottom} className="opacity-0! h-1! w-1!" />
      <div
        className="rounded-xl border-2 px-4 py-3 shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: style.bg, borderColor: style.border }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-1"
            style={{ backgroundColor: style.ring }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold" style={{ color: style.text }}>
              {node.patientName}
            </p>
            <p className="truncate text-[10px] text-gray-500">{node.ward}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ backgroundColor: style.border + "40", color: style.text }}
          >
            {node.nodeType}
          </span>
          <span className="text-[9px] text-gray-400">{node.organism}</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { transmissionNode: TransmissionNodeComponent };

export function NetworkGraph({ network, onSelectNode }: NetworkGraphProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const positions = radialLayout(network.nodes, network.links);

    const flowNodes: Node[] = network.nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: "transmissionNode",
        position: { x: pos.x, y: pos.y },
        data: { transmissionNode: n },
      };
    });

    const flowEdges: Edge[] = network.links.map((link, i) => {
      const color = LINK_COLORS[link.linkType] ?? "#94a3b8";
      return {
        id: `link-${i}`,
        source: link.sourceId,
        target: link.targetId,
        label: `${link.linkType} (${(link.confidence * 100).toFixed(0)}%)`,
        animated: link.confidence > 0.7,
        style: { stroke: color, strokeWidth: Math.max(1.5, link.confidence * 3) },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
        labelStyle: { fill: "#6b7280", fontSize: 9, fontWeight: 500 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
        labelBgPadding: [5, 3] as [number, number],
        labelBgBorderRadius: 4,
      };
    });

    return { flowNodes, flowEdges };
  }, [network]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const tNode = (node.data as Record<string, unknown>).transmissionNode as TransmissionNode;
      onSelectNode?.(tNode);
    },
    [onSelectNode],
  );

  return (
    <div className="h-[550px] w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelectNode?.(null)}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="rounded-xl! border! border-border! bg-white! shadow-lg!"
        />
      </ReactFlow>
    </div>
  );
}
