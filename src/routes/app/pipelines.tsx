import { useState, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  MarkerType,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Workflow, Play, Pause, Plus, ArrowLeft, Clock, Zap, Database, GitBranch, FileOutput,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Loading } from "../../components/ui/loading";
import { FlowNode } from "../../components/pipeline/flow-nodes";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, statusColor, cn } from "../../lib/utils";
import type { Pipeline, PipelineNode as PNode } from "../../types";

export const Route = createFileRoute("/app/pipelines")({
  component: PipelinesPage,
});

const nodeTypes = { flowNode: FlowNode };

function pipelineToFlow(pipeline: Pipeline): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = pipeline.nodes.map((n) => ({
    id: n.id,
    type: "flowNode",
    position: { x: n.positionX, y: n.positionY },
    data: { label: n.label, nodeKind: n.type, config: n.config },
  }));
  const edges: Edge[] = pipeline.edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.label ?? undefined,
    animated: true,
    style: { stroke: "#404040", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#404040", width: 16, height: 16 },
    labelStyle: { fill: "#6b7280", fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
  }));
  return { nodes, edges };
}

function PipelinesPage() {
  const pipelines = useAsync(() => api.pipelines.getAll(), []);
  const [selected, setSelected] = useState<Pipeline | null>(null);

  if (selected) {
    return <PipelineEditor pipeline={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <Header title="Data Pipelines" subtitle="Visual data flow editor for infection intelligence" />
      <div className="space-y-6 p-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active Pipelines"
            value={pipelines.data?.filter((p) => p.status === "Active").length ?? 0}
            accent="text-neutral-900"
            icon={Zap}
          />
          <StatCard
            label="Total Pipelines"
            value={pipelines.data?.length ?? 0}
            accent="text-neutral-900"
            icon={Workflow}
          />
          <StatCard
            label="Total Nodes"
            value={pipelines.data?.reduce((s, p) => s + p.nodes.length, 0) ?? 0}
            accent="text-neutral-900"
            icon={GitBranch}
          />
        </div>

        {/* Pipeline cards */}
        {pipelines.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pipelines.data?.map((pl) => (
              <Card
                key={pl.id}
                className="cursor-pointer transition-all hover:border-accent/30 hover:shadow-md"
                onClick={() => setSelected(pl)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/8">
                        <Workflow className="h-4 w-4 text-accent" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold text-primary">{pl.name}</h3>
                        <p className="text-[11px] text-muted">{pl.description}</p>
                      </div>
                    </div>
                    <Badge variant={statusColor(pl.status)}>{pl.status}</Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
                    <NodeCount icon={Database} count={pl.nodes.filter((n) => n.type === "source").length} label="Sources" />
                    <NodeCount icon={GitBranch} count={pl.nodes.filter((n) => n.type === "transform").length} label="Transforms" />
                    <NodeCount icon={FileOutput} count={pl.nodes.filter((n) => n.type === "output").length} label="Outputs" />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-light">
                    <Clock className="h-3 w-3" strokeWidth={1.8} />
                    {pl.lastRunAt ? `Last run ${formatDateTime(pl.lastRunAt)}` : "Never run"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineEditor({ pipeline, onBack }: { pipeline: Pipeline; onBack: () => void }) {
  const initial = useMemo(() => pipelineToFlow(pipeline), [pipeline]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
          animated: true,
          style: { stroke: "#404040", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#404040", width: 16, height: 16 },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const addNode = useCallback(
    (kind: "source" | "transform" | "output") => {
      const labels = { source: "New Source", transform: "New Transform", output: "New Output" };
      const id = `n_${Date.now()}`;
      const newNode: Node = {
        id,
        type: "flowNode",
        position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 200 },
        data: { label: labels[kind], nodeKind: kind, config: {} },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  return (
    <div className="flex h-screen flex-col">
      <Header title={pipeline.name} subtitle={pipeline.description} />
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{ animated: true }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "#f8f9fb" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d8e0" />
          <Controls
            position="bottom-right"
            showInteractive={false}
            className="rounded-xl! border! border-border! bg-white! shadow-lg!"
          />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              const kind = (node.data as Record<string, unknown>)?.nodeKind as string;
              if (kind === "source") return "#404040";
              if (kind === "transform") return "#525252";
              return "#737373";
            }}
            maskColor="rgba(0,0,0,0.05)"
            className="rounded-xl! border! border-border! bg-white/90! shadow-lg!"
          />

          {/* Top-left toolbar */}
          <Panel position="top-left">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Badge variant={statusColor(pipeline.status)}>{pipeline.status}</Badge>
            </div>
          </Panel>

          {/* Top-right node palette */}
          <Panel position="top-right">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-white p-1.5 shadow-lg">
              <span className="px-2 text-[11px] font-medium text-muted">Add:</span>
              <button
                onClick={() => addNode("source")}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                <Database className="h-3 w-3" strokeWidth={2} /> Source
              </button>
              <button
                onClick={() => addNode("transform")}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                <GitBranch className="h-3 w-3" strokeWidth={2} /> Transform
              </button>
              <button
                onClick={() => addNode("output")}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                <FileOutput className="h-3 w-3" strokeWidth={2} /> Output
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function NodeCount({ icon: Icon, count, label }: { icon: typeof Database; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-light" strokeWidth={1.8} />
      <span className="text-[11px] font-semibold text-secondary">{count}</span>
      <span className="text-[10px] text-muted-light">{label}</span>
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }: { label: string; value: number; accent: string; icon: typeof Zap }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">{label}</p>
          <p className={cn("mt-1 text-[28px] font-semibold leading-tight tracking-tight", accent)}>{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
          <Icon className="h-5 w-5 text-neutral-600" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
