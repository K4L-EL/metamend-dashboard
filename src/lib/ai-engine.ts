import { api } from "./api";
import type {
  DashboardSummary, Infection, Patient, Outbreak,
  ForecastRiskScore, Alert, ResistanceSummary,
  TransmissionNetwork, ScreeningCompliance, DeviceSummary,
} from "../types";

interface DashboardContext {
  summary: DashboardSummary | null;
  infections: Infection[];
  patients: Patient[];
  outbreaks: Outbreak[];
  riskScores: ForecastRiskScore[];
  alerts: Alert[];
  resistance: ResistanceSummary[];
  transmission: TransmissionNetwork | null;
  screening: ScreeningCompliance[];
  devices: DeviceSummary[];
}

async function gatherContext(): Promise<DashboardContext> {
  const [summary, infections, patients, outbreaks, riskScores, alerts, resistance, transmission, screening, devices] =
    await Promise.allSettled([
      api.dashboard.getSummary(),
      api.infections.getAll(),
      api.patients.getAll(),
      api.outbreaks.getAll(),
      api.forecasts.getRiskScores(),
      api.alerts.getAll(),
      api.resistance.getSummaries(),
      api.transmission.getNetwork(),
      api.screening.getCompliance(),
      api.devices.getSummaries(),
    ]);

  return {
    summary: summary.status === "fulfilled" ? summary.value : null,
    infections: infections.status === "fulfilled" ? infections.value : [],
    patients: patients.status === "fulfilled" ? patients.value : [],
    outbreaks: outbreaks.status === "fulfilled" ? outbreaks.value : [],
    riskScores: riskScores.status === "fulfilled" ? riskScores.value : [],
    alerts: alerts.status === "fulfilled" ? alerts.value : [],
    resistance: resistance.status === "fulfilled" ? resistance.value : [],
    transmission: transmission.status === "fulfilled" ? transmission.value : null,
    screening: screening.status === "fulfilled" ? screening.value : [],
    devices: devices.status === "fulfilled" ? devices.value : [],
  };
}

function analyzeInfectionTrends(ctx: DashboardContext): string {
  const active = ctx.infections.filter((i) => i.status === "Active");
  const haiCount = active.filter((i) => i.isHai).length;
  const organisms = [...new Set(active.map((i) => i.organism))];
  const wards = [...new Set(active.map((i) => i.ward))];
  const critical = active.filter((i) => i.severity === "Critical");

  const lines = [
    `**Current Infection Summary**\n`,
    `There are currently **${active.length} active infections** across ${wards.length} wards.`,
    haiCount > 0 ? `${haiCount} of these are healthcare-associated infections (HAIs), which requires immediate attention.` : "",
    `\nThe organisms involved are: ${organisms.join(", ")}.`,
    critical.length > 0
      ? `\n⚠️ **${critical.length} critical-severity** infection${critical.length > 1 ? "s" : ""} requiring urgent intervention.`
      : "",
    wards.length > 0 ? `\nMost affected wards: ${wards.slice(0, 3).join(", ")}.` : "",
    `\n**Recommendations:**`,
    `• Review antimicrobial therapy for all critical cases`,
    `• Ensure contact precautions are in place for HAI patients`,
    `• Consider enhanced environmental cleaning in ${wards[0] ?? "affected wards"}`,
  ];

  return lines.filter(Boolean).join("\n");
}

function analyzeHighRiskPatients(ctx: DashboardContext): string {
  const highRisk = ctx.patients
    .filter((p) => p.riskScore > 0.6)
    .sort((a, b) => b.riskScore - a.riskScore);

  if (highRisk.length === 0) {
    return "No patients currently meet the high-risk threshold (>60%). Continue routine surveillance.";
  }

  const top5 = highRisk.slice(0, 5);
  const lines = [
    `**High-Risk Patient Analysis**\n`,
    `There are **${highRisk.length} patients** with risk scores above 60%.\n`,
    `Top at-risk patients:`,
    ...top5.map((p, i) =>
      `${i + 1}. **${p.name}** — ${Math.round(p.riskScore * 100)}% risk | ${p.ward} | ${p.organisms.length > 0 ? p.organisms.join(", ") : "No active organisms"} | ${p.activeInfections} active infection${p.activeInfections !== 1 ? "s" : ""}`
    ),
    `\n**Key Observations:**`,
    highRisk.filter((p) => p.riskScore > 0.8).length > 0
      ? `• ${highRisk.filter((p) => p.riskScore > 0.8).length} patient(s) are in the critical risk zone (>80%) — escalate to senior IPC team`
      : `• No patients in critical risk zone, but close monitoring advised`,
    `• Common organisms: ${[...new Set(highRisk.flatMap((p) => p.organisms))].join(", ") || "Various"}`,
    `\n**Recommendations:**`,
    `• Prioritize daily review for top 5 patients`,
    `• Consider pre-emptive isolation for patients >80% risk`,
    `• Ensure screening compliance for all high-risk patients`,
  ];

  return lines.join("\n");
}

function analyzeOutbreaks(ctx: DashboardContext): string {
  const active = ctx.outbreaks.filter((o) => o.status === "Active");
  const suspected = ctx.outbreaks.filter((o) => o.status === "Suspected");
  const totalAffected = active.reduce((sum, o) => sum + o.affectedPatients, 0);

  if (active.length === 0 && suspected.length === 0) {
    return "No active or suspected outbreaks currently. Continue routine surveillance protocols.";
  }

  const lines = [
    `**Outbreak Intelligence Report**\n`,
    `Currently tracking **${active.length} active** and **${suspected.length} suspected** outbreak${active.length + suspected.length > 1 ? "s" : ""}.`,
    `Total patients affected: **${totalAffected}**.\n`,
  ];

  for (const outbreak of active) {
    lines.push(
      `🔴 **${outbreak.organism}** in ${outbreak.location}`,
      `   Severity: ${outbreak.severity} | ${outbreak.affectedPatients} patients | ${outbreak.investigationStatus}`,
      `   Detected: ${new Date(outbreak.detectedAt).toLocaleDateString()}\n`,
    );
  }

  lines.push(
    `**Conclusions:**`,
    active.some((o) => o.affectedPatients > 3)
      ? `• Large cluster detected — consider ward closure or cohorting`
      : `• Outbreaks appear contained. Maintain enhanced surveillance.`,
    `• Cross-referencing with resistance data shows ${ctx.resistance.length > 0 ? "potential antimicrobial pressure" : "no significant resistance patterns"}`,
    `\n**Preventive Measures:**`,
    `• Implement enhanced contact precautions in affected areas`,
    `• Screen all patients and staff contacts within 48 hours`,
    `• Review antibiotic prescribing in outbreak wards`,
    `• Consider environmental deep cleaning protocol`,
  );

  return lines.join("\n");
}

function analyzeResistance(ctx: DashboardContext): string {
  if (ctx.resistance.length === 0) return "No resistance data available for analysis.";

  const highMdr = ctx.resistance.filter((r) => r.mdrRate > 0.3).sort((a, b) => b.mdrRate - a.mdrRate);

  const lines = [
    `**Antimicrobial Resistance Analysis**\n`,
    `Monitoring **${ctx.resistance.length} organism${ctx.resistance.length > 1 ? "s" : ""}** for resistance patterns.\n`,
  ];

  for (const r of ctx.resistance) {
    const mdrPct = (r.mdrRate * 100).toFixed(1);
    lines.push(`• **${r.organism}**: MDR rate ${mdrPct}% (${r.totalIsolates} isolates)`);
    const rising = r.patterns.filter((p) => p.trend === "Rising");
    if (rising.length > 0) {
      lines.push(`  ⚠️ Rising resistance to: ${rising.map((p) => p.antibiotic).join(", ")}`);
    }
  }

  if (highMdr.length > 0) {
    lines.push(
      `\n**Concerning Trends:**`,
      `${highMdr.length} organism(s) showing MDR rates above 30%.`,
      `\n**Recommendations:**`,
      `• Restrict use of ${highMdr[0]?.patterns.filter((p) => p.resistanceRate > 0.5).map((p) => p.antibiotic).join(", ") ?? "broad-spectrum antibiotics"} pending susceptibility`,
      `• Implement antibiotic stewardship rounds focusing on ${highMdr.map((r) => r.organism).join(", ")}`,
      `• Consider sending isolates for molecular typing to confirm clonal spread`,
    );
  }

  return lines.join("\n");
}

function analyzeAlerts(ctx: DashboardContext): string {
  const unread = ctx.alerts.filter((a) => !a.isRead);
  const critical = ctx.alerts.filter((a) => a.severity === "Critical");
  const categories = ctx.alerts.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lines = [
    `**Alert Summary**\n`,
    `Total alerts: **${ctx.alerts.length}** (${unread.length} unread)`,
    critical.length > 0 ? `⚠️ **${critical.length} critical alerts** requiring immediate attention.\n` : "",
    `By category:`,
    ...Object.entries(categories).sort(([, a], [, b]) => b - a).map(([cat, count]) => `• ${cat}: ${count}`),
    `\n**Priority Actions:**`,
    critical.length > 0
      ? `• Address ${critical.length} critical alerts first — these may indicate active patient safety concerns`
      : `• No critical alerts — focus on clearing unread notifications`,
    `• Review and acknowledge all alerts within your shift`,
  ];

  return lines.filter(Boolean).join("\n");
}

function analyzeScreening(ctx: DashboardContext): string {
  if (ctx.screening.length === 0) return "No screening compliance data available.";

  const avgCompliance = ctx.screening.reduce((sum, s) => sum + s.complianceRate, 0) / ctx.screening.length;
  const lowCompliance = ctx.screening.filter((s) => s.complianceRate < 0.8);
  const overdue = ctx.screening.reduce((sum, s) => sum + s.overdue, 0);

  const lines = [
    `**Screening Compliance Report**\n`,
    `Average compliance across all wards: **${(avgCompliance * 100).toFixed(1)}%**`,
    `Total overdue screenings: **${overdue}**\n`,
    lowCompliance.length > 0 ? `Wards below 80% compliance:` : "All wards meeting compliance targets.",
    ...lowCompliance.map((s) => `• **${s.ward}**: ${(s.complianceRate * 100).toFixed(1)}% (${s.overdue} overdue)`),
    `\n**Recommendations:**`,
    lowCompliance.length > 0
      ? `• Prioritize overdue screenings in ${lowCompliance.map((s) => s.ward).join(", ")}`
      : `• Maintain current screening schedules`,
    `• Ensure staff are aware of screening protocols for new admissions`,
  ];

  return lines.join("\n");
}

function analyzeDevices(ctx: DashboardContext): string {
  if (ctx.devices.length === 0) return "No device surveillance data available.";

  const highRate = ctx.devices.filter((d) => d.infectionRate > 3);

  const lines = [
    `**Device-Associated Infection Analysis**\n`,
    `Monitoring **${ctx.devices.length} device type${ctx.devices.length > 1 ? "s" : ""}**.\n`,
    ...ctx.devices.map((d) => `• **${d.deviceType}**: ${d.infections} infections / ${d.totalDevices} devices (${d.infectionRate.toFixed(1)}% rate, avg ${d.avgDaysToInfection} days to infection)`),
    highRate.length > 0
      ? `\n⚠️ ${highRate.length} device type(s) exceeding 3% infection rate benchmark.`
      : `\nAll device types within acceptable infection rate benchmarks.`,
    `\n**Prevention Strategies:**`,
    `• Review insertion and maintenance bundles for high-rate devices`,
    `• Audit daily necessity assessments — remove devices as soon as clinically appropriate`,
    `• Ensure aseptic technique during insertion and line access`,
  ];

  return lines.join("\n");
}

function generateSummary(ctx: DashboardContext): string {
  const s = ctx.summary;
  if (!s) return "Unable to retrieve dashboard summary. Please try again.";

  const activeOutbreaks = ctx.outbreaks.filter((o) => o.status === "Active");
  const criticalPatients = ctx.patients.filter((p) => p.riskScore > 0.75);
  const unreadAlerts = ctx.alerts.filter((a) => !a.isRead).length;

  const lines = [
    `**MetaMed Intelligence Summary**\n`,
    `📊 **Active Infections:** ${s.activeInfections} (${s.infectionRateChange > 0 ? "↑" : "↓"} ${Math.abs(s.infectionRateChange).toFixed(1)}% change)`,
    `⚠️ **Patients at Risk:** ${s.patientsAtRisk}`,
    `🔴 **Active Outbreaks:** ${s.activeOutbreaks}`,
    `🔔 **Pending Alerts:** ${s.pendingAlerts} (${unreadAlerts} unread)`,
    `📈 **Avg Risk Score:** ${(s.riskScoreAverage * 100).toFixed(0)}%\n`,
    `**Key Concerns:**`,
    criticalPatients.length > 0 ? `• ${criticalPatients.length} patients in critical risk zone (>75%)` : `• No patients in critical risk zone`,
    activeOutbreaks.length > 0 ? `• ${activeOutbreaks.length} active outbreak(s): ${activeOutbreaks.map((o) => `${o.organism} in ${o.location}`).join(", ")}` : `• No active outbreaks`,
    s.infectionRateChange > 5 ? `• Infection rate rising — review IPC measures` : "",
    `\n**Immediate Actions:**`,
    `1. Review and triage unread alerts (${unreadAlerts})`,
    criticalPatients.length > 0 ? `2. Assess ${criticalPatients.length} critical-risk patients` : `2. Continue routine surveillance`,
    activeOutbreaks.length > 0 ? `3. Check outbreak containment status` : `3. Maintain standard precautions`,
  ];

  return lines.filter(Boolean).join("\n");
}

type IntentHandler = (ctx: DashboardContext) => string;

const INTENT_MAP: { patterns: RegExp[]; handler: IntentHandler }[] = [
  {
    patterns: [/summar/i, /overview/i, /today/i, /brief/i, /status/i, /what.*going on/i, /tell me about/i],
    handler: generateSummary,
  },
  {
    patterns: [/infection.*trend/i, /trend.*infection/i, /hai/i, /active.*infection/i, /infection/i],
    handler: analyzeInfectionTrends,
  },
  {
    patterns: [/high.*risk/i, /at.?risk/i, /risk.*patient/i, /patient.*risk/i, /which patient/i, /who.*risk/i],
    handler: analyzeHighRiskPatients,
  },
  {
    patterns: [/outbreak/i, /cluster/i, /spread/i, /mrsa.*outbreak/i],
    handler: analyzeOutbreaks,
  },
  {
    patterns: [/resist/i, /amr/i, /antimicrobial/i, /antibiotic.*review/i, /mdr/i, /antibiotic/i],
    handler: analyzeResistance,
  },
  {
    patterns: [/alert/i, /notif/i, /warning/i, /pending/i],
    handler: analyzeAlerts,
  },
  {
    patterns: [/screen/i, /compliance/i, /overdue/i],
    handler: analyzeScreening,
  },
  {
    patterns: [/device/i, /catheter/i, /line.*infection/i, /clabsi/i, /cauti/i],
    handler: analyzeDevices,
  },
  {
    patterns: [/prevent/i, /recommend/i, /what.*should/i, /action/i, /suggestion/i],
    handler: (ctx) => {
      const parts = [generateSummary(ctx), "\n---\n", analyzeOutbreaks(ctx)];
      return parts.join("\n");
    },
  },
  {
    patterns: [/transmis/i, /network/i, /contact.*trac/i, /source.*invest/i, /link/i],
    handler: (ctx) => {
      if (!ctx.transmission) return "No transmission network data available.";
      const t = ctx.transmission;
      const lines = [
        `**Transmission Network Summary**\n`,
        `Organism: **${t.organism}**`,
        `Total linked cases: **${t.totalCases}**`,
        `Network nodes: ${t.nodes.length} | Links: ${t.links.length}\n`,
        `Node types: ${[...new Set(t.nodes.map((n) => n.nodeType))].join(", ")}`,
        `Link types: ${[...new Set(t.links.map((l) => l.linkType))].join(", ")}\n`,
        `Average link confidence: ${(t.links.reduce((s, l) => s + l.confidence, 0) / Math.max(t.links.length, 1) * 100).toFixed(0)}%`,
      ];
      return lines.join("\n");
    },
  },
];

function matchIntent(query: string): IntentHandler | null {
  for (const { patterns, handler } of INTENT_MAP) {
    if (patterns.some((p) => p.test(query))) return handler;
  }
  return null;
}

async function generateLocalResponse(query: string): Promise<string> {
  const ctx = await gatherContext();
  const handler = matchIntent(query);

  if (handler) return handler(ctx);

  return generateSummary(ctx) +
    "\n\n---\n\n*I can help with: infection trends, at-risk patients, outbreak analysis, resistance patterns, alerts, screening compliance, device infections, transmission networks, and prevention recommendations. Try asking a more specific question!*";
}

export async function generateAiResponse(query: string): Promise<string> {
  try {
    return await api.ai.chat(query);
  } catch {
    return generateLocalResponse(query);
  }
}
