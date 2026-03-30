import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export interface GanttPatient {
  id: string;
  name: string;
  organism: string;
  wardStays: { ward: string; start: Date; end: Date }[];
  infectionDate: Date;
}

interface GanttChartProps {
  patients: GanttPatient[];
  title?: string;
  onPatientClick?: (patientId: string) => void;
}

const WARD_COLORS: Record<string, string> = {
  "ICU-A": "#c4b5fd",
  "ICU-B": "#c4b5fd",
  "Ward 2A": "#a5b4fc",
  "Ward 3B": "#93c5fd",
  "Ward 4C": "#bfdbfe",
  "Surgical": "#d8b4fe",
  "Emergency": "#fca5a5",
  "Neonatal": "#bbf7d0",
};

export function GanttChart({ patients, title, onPatientClick }: GanttChartProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const { startDate, endDate, totalDays, dayWidth } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of patients) {
      for (const s of p.wardStays) {
        min = Math.min(min, s.start.getTime());
        max = Math.max(max, s.end.getTime());
      }
      min = Math.min(min, p.infectionDate.getTime());
      max = Math.max(max, p.infectionDate.getTime());
    }
    const pad = 2 * 86400000;
    const start = new Date(min - pad);
    const end = new Date(max + pad);
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    return { startDate: start, endDate: end, totalDays: days, dayWidth: Math.max(16, 600 / days) };
  }, [patients]);

  const dateLabels = useMemo(() => {
    const labels: { date: Date; label: string; x: number }[] = [];
    const interval = totalDays > 30 ? 7 : totalDays > 14 ? 3 : 1;
    const d = new Date(startDate);
    while (d <= endDate) {
      const dayOffset = (d.getTime() - startDate.getTime()) / 86400000;
      labels.push({ date: new Date(d), label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), x: dayOffset * dayWidth });
      d.setDate(d.getDate() + interval);
    }
    return labels;
  }, [startDate, endDate, totalDays, dayWidth]);

  const chartWidth = totalDays * dayWidth;
  const rowHeight = 36;
  const headerHeight = 40;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {title && (
        <div className="border-b border-neutral-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
      )}
      <div className="flex overflow-x-auto">
        {/* Left labels */}
        <div className="shrink-0 border-r border-neutral-200 bg-neutral-50">
          <div className="flex h-10 items-center px-4 text-[10px] font-medium text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
            Patient detail
          </div>
          {patients.map((p) => (
            <div
              key={p.id}
              className={cn("flex h-9 items-center gap-2 px-4 border-b border-neutral-100 transition-colors", hoveredRow === p.id && "bg-sky-50")}
              onMouseEnter={() => setHoveredRow(p.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {onPatientClick ? (
                <button className="text-xs font-medium text-sky-600 hover:underline" onClick={() => onPatientClick(p.id)}>
                  {p.name}
                </button>
              ) : (
                <span className="text-xs text-neutral-700">{p.name}</span>
              )}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 min-w-0">
          <svg width={chartWidth} height={headerHeight + patients.length * rowHeight} className="block">
            {/* Date header */}
            {dateLabels.map((dl, i) => (
              <g key={i}>
                <line x1={dl.x} y1={0} x2={dl.x} y2={headerHeight + patients.length * rowHeight} stroke="#f0f0f0" strokeWidth={1} />
                <text x={dl.x + 3} y={14} fontSize={9} fill="#a3a3a3">{dl.label}</text>
              </g>
            ))}
            <line x1={0} y1={headerHeight} x2={chartWidth} y2={headerHeight} stroke="#e5e5e5" strokeWidth={1} />

            {/* Patient rows */}
            {patients.map((p, rowIdx) => {
              const y = headerHeight + rowIdx * rowHeight;
              const isHovered = hoveredRow === p.id;

              return (
                <g
                  key={p.id}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {isHovered && (
                    <rect x={0} y={y} width={chartWidth} height={rowHeight} fill="#f0f9ff" />
                  )}
                  <line x1={0} y1={y + rowHeight} x2={chartWidth} y2={y + rowHeight} stroke="#f5f5f5" strokeWidth={1} />

                  {/* Ward stay bars */}
                  {p.wardStays.map((stay, si) => {
                    const sx = ((stay.start.getTime() - startDate.getTime()) / 86400000) * dayWidth;
                    const sw = Math.max(dayWidth * 0.5, ((stay.end.getTime() - stay.start.getTime()) / 86400000) * dayWidth);
                    const fill = WARD_COLORS[stay.ward] ?? "#c4b5fd";
                    return (
                      <g key={si}>
                        <rect x={sx} y={y + 8} width={sw} height={20} rx={4} fill={fill} opacity={0.7} />
                        <text x={sx + 4} y={y + 22} fontSize={9} fill="#4b5563" fontWeight={500}>
                          {stay.ward}
                        </text>
                      </g>
                    );
                  })}

                  {/* Infection marker (diamond) */}
                  {(() => {
                    const ix = ((p.infectionDate.getTime() - startDate.getTime()) / 86400000) * dayWidth;
                    const cy = y + 18;
                    return (
                      <g>
                        <polygon
                          points={`${ix},${cy - 7} ${ix + 7},${cy} ${ix},${cy + 7} ${ix - 7},${cy}`}
                          fill="#ef4444"
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-neutral-200 px-4 py-2">
        {Object.entries(WARD_COLORS).slice(0, 5).map(([ward, color]) => (
          <div key={ward} className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded-sm" style={{ background: color, opacity: 0.7 }} />
            <span className="text-[10px] text-neutral-500">{ward}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <svg width={12} height={12}><polygon points="6,0 12,6 6,12 0,6" fill="#ef4444" /></svg>
          <span className="text-[10px] text-neutral-500">Infection detected</span>
        </div>
      </div>
    </div>
  );
}
