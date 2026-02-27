import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X, Users, Link2, GitBranch } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { NetworkGraph } from "../../components/transmission/network-graph";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, cn } from "../../lib/utils";
import type { TransmissionNode } from "../../types";

export const Route = createFileRoute("/app/transmission")({
  component: TransmissionPage,
});

const NODE_COLORS: Record<string, string> = {
  Index: "bg-neutral-900",
  Secondary: "bg-neutral-700",
  Environmental: "bg-neutral-600",
  HCW: "bg-neutral-500",
  "Suspected Source": "bg-neutral-400",
};

const LINK_COLORS: Record<string, string> = {
  "Direct Contact": "bg-neutral-900",
  "Shared Equipment": "bg-neutral-700",
  "Ward Proximity": "bg-neutral-600",
  "Temporal Link": "bg-neutral-500",
  "Environmental": "bg-neutral-400",
};

function TransmissionPage() {
  const [organism, setOrganism] = useState("MRSA");
  const [selectedNode, setSelectedNode] = useState<TransmissionNode | null>(null);
  const network = useAsync(() => api.transmission.getNetwork(organism), [organism]);

  return (
    <div>
      <Header title="Source Investigation" subtitle="Transmission network and outbreak chain analysis" />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
        {/* Organism filters */}
        <div className="flex items-center gap-2">
          {["MRSA", "C. difficile"].map((org) => (
            <Button
              key={org}
              variant={organism === org ? "primary" : "secondary"}
              size="sm"
              onClick={() => { setOrganism(org); setSelectedNode(null); }}
            >
              {org}
            </Button>
          ))}
        </div>

        {network.loading ? (
          <Loading />
        ) : network.data ? (
          <>
            {/* Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard icon={Users} label="Cases Linked" value={network.data.totalCases} />
              <MetricCard icon={Link2} label="Transmission Links" value={network.data.links.length} />
              <MetricCard icon={GitBranch} label="Nodes in Network" value={network.data.nodes.length} />
            </div>

            {/* Graph + Detail panel */}
            <div className="flex gap-6">
              <div className="flex-1">
                <NetworkGraph network={network.data} onSelectNode={setSelectedNode} />
              </div>

              {/* Node detail panel */}
              {selectedNode && (
                <div className="w-80 shrink-0">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-3.5 w-3.5 rounded-full", NODE_COLORS[selectedNode.nodeType] ?? "bg-gray-400")} />
                          <div>
                            <h3 className="text-[14px] font-semibold text-primary">{selectedNode.patientName}</h3>
                            <p className="text-[11px] text-muted">{selectedNode.nodeType}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="rounded-md p-1 text-muted-light hover:bg-surface-inset hover:text-primary">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <DetailRow label="Ward" value={selectedNode.ward} />
                        <DetailRow label="Organism" value={selectedNode.organism} />
                        <DetailRow label="Detected" value={formatDateTime(selectedNode.detectedAt)} />
                        <DetailRow label="Node Type" value={selectedNode.nodeType} />
                      </div>

                      {/* Connections from this node */}
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="mb-3 text-[11px] font-semibold tracking-wide text-muted-light uppercase">Connections</p>
                        <div className="space-y-2.5">
                          {network.data!.links
                            .filter((l) => l.sourceId === selectedNode.id || l.targetId === selectedNode.id)
                            .map((link, i) => {
                              const otherId = link.sourceId === selectedNode.id ? link.targetId : link.sourceId;
                              const other = network.data!.nodes.find((n) => n.id === otherId);
                              const direction = link.sourceId === selectedNode.id ? "→" : "←";
                              return (
                                <div key={i} className="rounded-lg bg-surface-alt p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-light">{direction}</span>
                                    <span className="text-[12px] font-medium text-primary">{other?.patientName ?? otherId}</span>
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Badge className="text-[9px]">{link.linkType}</Badge>
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-1 w-10 overflow-hidden rounded-full bg-surface-inset">
                                        <div className="h-full rounded-full bg-accent" style={{ width: `${link.confidence * 100}%` }} />
                                      </div>
                                      <span className="text-[9px] tabular-nums text-muted-light">{(link.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-[10px] text-muted">{link.evidence}</p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Legends */}
            <div className="flex gap-6">
              <Card className="flex-1">
                <CardContent className="flex flex-wrap gap-5 p-4">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-light uppercase">Node Types</span>
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
                      <span className="text-[11px] text-muted">{type}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex flex-wrap gap-5 p-4">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-light uppercase">Link Types</span>
                  {Object.entries(LINK_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("h-0.5 w-4 rounded-full", color)} />
                      <span className="text-[11px] text-muted">{type}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">{label}</p>
          <p className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-neutral-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
          <Icon className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[12px] font-medium text-primary">{value}</span>
    </div>
  );
}
