import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { X, Users, Link2, GitBranch, Bot, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Badge } from "../../components/ui/badge";
import { Loading } from "../../components/ui/loading";
import { StatCard } from "../../components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { NetworkGraph } from "../../components/transmission/network-graph";
import { useAsync } from "../../hooks/use-async";
import { api } from "../../lib/api";
import { formatDateTime, cn } from "../../lib/utils";
import type { TransmissionNode, TransmissionNetwork } from "../../types";

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

function generateNetworkAnalysis(data: TransmissionNetwork): { title: string; findings: string[]; recommendations: string[] } {
  const indexNodes = data.nodes.filter((n) => n.nodeType === "Index");
  const directLinks = data.links.filter((l) => l.linkType === "Direct Contact");
  const highConfidence = data.links.filter((l) => l.confidence > 0.7);
  const wards = [...new Set(data.nodes.map((n) => n.ward))];

  return {
    title: `${data.organism} Transmission Network Analysis`,
    findings: [
      `Network contains ${data.totalCases} linked cases across ${wards.length} ward${wards.length > 1 ? "s" : ""} (${wards.join(", ")}).`,
      `${indexNodes.length} index case${indexNodes.length !== 1 ? "s" : ""} identified as potential source${indexNodes.length !== 1 ? "s" : ""} of transmission.`,
      `${directLinks.length} direct contact link${directLinks.length !== 1 ? "s" : ""} established, suggesting ${directLinks.length > 3 ? "sustained person-to-person" : "limited"} transmission.`,
      `${highConfidence.length} link${highConfidence.length !== 1 ? "s" : ""} with >70% confidence — molecular and epidemiological evidence supports clonal spread.`,
      data.nodes.length > 5
        ? `The network size suggests an established outbreak. Urgent containment measures recommended.`
        : `Network is relatively contained. Enhanced surveillance should prevent further spread.`,
    ],
    recommendations: [
      `Implement contact precautions for all ${data.totalCases} linked patients.`,
      `Screen all patients and staff in ${wards.join(", ")} for ${data.organism}.`,
      `Review antimicrobial prescribing in affected wards — consider antibiotic stewardship intervention.`,
      `Conduct environmental sampling in ${wards[0]} where index case was identified.`,
      `Schedule IPC committee review within 48 hours to assess containment progress.`,
    ],
  };
}

function TransmissionPage() {
  const navigate = useNavigate();
  const [organism, setOrganism] = useState("MRSA");
  const [selectedNode, setSelectedNode] = useState<TransmissionNode | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const network = useAsync(() => api.transmission.getNetwork(organism), [organism]);

  const analysis = useMemo(
    () => network.data ? generateNetworkAnalysis(network.data) : null,
    [network.data],
  );

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

                      <button
                        onClick={() => navigate({ to: "/app/patients", search: { patientId: selectedNode.id } })}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Patient Profile
                      </button>

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
                                    <button
                                      className="text-xs font-medium text-sky-600 hover:underline"
                                      onClick={() => navigate({ to: "/app/patients", search: { patientId: otherId } })}
                                    >
                                      {other?.patientName ?? otherId}
                                    </button>
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

            {/* AI Outbreak Analysis */}
            {analysis && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Bot className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-sm font-semibold text-neutral-900">{analysis.title}</h3>

                      <div>
                        <p className="mb-2 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">Key Findings</p>
                        <ul className="space-y-1.5">
                          {analysis.findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
                              <span className="mt-0.5 text-neutral-400">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">Recommendations</p>
                        <ul className="space-y-1.5">
                          {analysis.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
                              <span className="mt-0.5 text-sky-500 font-semibold">{i + 1}.</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
