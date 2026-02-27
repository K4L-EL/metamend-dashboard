const LEGEND_ITEMS = [
  { label: "Infected", dotColor: "#dc2626" },
  { label: "At Risk", dotColor: "#ca8a04" },
  { label: "Stable", dotColor: "#16a34a" },
  { label: "Empty", dotColor: "#404040" },
] as const;

export function MapLegend({ light }: { light: boolean }) {
  return (
    <div
      className={`absolute bottom-4 left-4 rounded-lg border p-3 shadow-xl sm:bottom-6 sm:left-6 sm:p-4 ${
        light
          ? "border-neutral-300 bg-white/95"
          : "border-neutral-700 bg-neutral-900/95"
      }`}
    >
      <p className={`mb-2 text-[10px] font-semibold tracking-wider uppercase sm:mb-2.5 ${light ? "text-neutral-500" : "text-neutral-400"}`}>
        Bed Status
      </p>
      <div className="space-y-1.5 sm:space-y-2">
        {LEGEND_ITEMS.map(({ label, dotColor }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
            />
            <span className={`text-[11px] ${light ? "text-neutral-600" : "text-neutral-300"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
