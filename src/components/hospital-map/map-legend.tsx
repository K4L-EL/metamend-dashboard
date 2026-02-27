const LEGEND_ITEMS = [
  { label: "Infected", dotColor: "#dc2626", bedColor: "bg-[#2a1a1a]" },
  { label: "At Risk", dotColor: "#ca8a04", bedColor: "bg-[#2a2a1a]" },
  { label: "Stable", dotColor: "#16a34a", bedColor: "bg-[#1a2a1a]" },
  { label: "Empty", dotColor: "#404040", bedColor: "bg-neutral-800" },
] as const;

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 shadow-xl">
      <p className="mb-2.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
        Bed Status
      </p>
      <div className="space-y-2">
        {LEGEND_ITEMS.map(({ label, dotColor }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
            />
            <span className="text-[11px] text-neutral-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
