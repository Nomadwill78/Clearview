import ScoreBadge from "./score-badge";

interface Props {
  domain: string;
  label: string;
  score: number | null;
  kpiCount: number;
}

export default function DomainCard({ label, score, kpiCount }: Props) {
  const pct = score ? ((score - 1) / 4) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-serif text-base" style={{ color: "var(--color-navy)" }}>{label}</h3>
        {score !== null ? <ScoreBadge score={score} /> : (
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">No data</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 60 ? "var(--color-success)" : pct >= 40 ? "var(--color-warning)" : "var(--color-danger)",
          }}
        />
      </div>

      <p className="text-xs text-gray-400">
        {kpiCount} KPI{kpiCount !== 1 ? "s" : ""} tracked
      </p>
    </div>
  );
}
