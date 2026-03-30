import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X, Users, Link2, GitBranch } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardContent } from "../../components/ui/card";
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
  Index: "bg-red-500",
  Secondary: "bg-neutral-500",
  Environmental: "bg-sky-500",
  HCW: "bg-blue-400",
  "Suspected Source": "bg-purple-400",
};

const LINK_COLORS: Record<string, string> = {
  "Direct Contact": "bg-red-500",
  "Shared Equipment": "bg-neutral-500",
  "Ward Proximity": "bg-sky-500",
  "Temporal Link": "bg-blue-400",
  "Environmental": "bg-neutral-400",
};

function TransmissionPage() {
  const [organism, setOrganism] = useState("MRSA");
  const [selectedNode, setSelectedNode] = useState<TransmissionNode | null>(null);
  const network = useAsync(() => api.transmission.getNetwork(organism), [organism]);

  return (
    <div>
      <Header title="Source Investigation" subtitle="Transmission network and outbreak chain analysis" />
      <div className="space-y-6 p-4 sm:p-6">
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
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Cases Linked"
                value={network.data.totalCases}
                icon={<Users className="h-[18px] w-[18px]" strokeWidth={1.8} />}
                accent="danger"
              />
              <StatCard
                title="Transmission Links"
                value={network.data.links.length}
                icon={<Link2 className="h-[18px] w-[18px]" strokeWidth={1.8} />}
                accent="warning"
              />
              <StatCard
                title="Nodes in Network"
                value={network.data.nodes.length}
                icon={<GitBranch className="h-[18px] w-[18px]" strokeWidth={1.8} />}
                accent="metamed"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <NetworkGraph network={network.data} onSelectNode={setSelectedNode} />
              </div>

              {selectedNode && (
                <div className="w-80 shrink-0">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("h-3.5 w-3.5 rounded-full", NODE_COLORS[selectedNode.nodeType] ?? "bg-gray-400")} />
                          <div>
                            <h3 className="text-sm font-semibold text-neutral-900">{selectedNode.patientName}</h3>
                            <p className="text-xs text-neutral-500">{selectedNode.nodeType}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <DetailRow label="Ward" value={selectedNode.ward} />
                        <DetailRow label="Organism" value={selectedNode.organism} />
                        <DetailRow label="Detected" value={formatDateTime(selectedNode.detectedAt)} />
                        <DetailRow label="Node Type" value={selectedNode.nodeType} />
                      </div>

                      <div className="mt-5 border-t border-neutral-200 pt-4">
                        <p className="mb-3 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">Connections</p>
                        <div className="space-y-2.5">
                          {network.data!.links
                            .filter((l) => l.sourceId === selectedNode.id || l.targetId === selectedNode.id)
                            .map((link, i) => {
                              const otherId = link.sourceId === selectedNode.id ? link.targetId : link.sourceId;
                              const other = network.data!.nodes.find((n) => n.id === otherId);
                              const direction = link.sourceId === selectedNode.id ? "→" : "←";
                              return (
                                <div key={i} className="rounded-lg bg-neutral-50 p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-400">{direction}</span>
                                    <span className="text-xs font-medium text-neutral-900">{other?.patientName ?? otherId}</span>
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Badge className="text-[10px]">{link.linkType}</Badge>
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-1 w-10 overflow-hidden rounded-full bg-neutral-200">
                                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${link.confidence * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] tabular-nums text-neutral-400">{(link.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-[10px] text-neutral-500">{link.evidence}</p>
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

            <div className="flex gap-6">
              <Card className="flex-1">
                <CardContent className="flex flex-wrap gap-5 p-4">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">Node Types</span>
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
                      <span className="text-xs text-neutral-500">{type}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex flex-wrap gap-5 p-4">
                  <span className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">Link Types</span>
                  {Object.entries(LINK_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn("h-0.5 w-4 rounded-full", color)} />
                      <span className="text-xs text-neutral-500">{type}</span>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-xs font-medium text-neutral-900">{value}</span>
    </div>
  );
}
