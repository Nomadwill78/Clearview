interface Props { score: number }

const LEVELS = [
  { min: 4.5, label: "Excellent", bg: "#dcfce7", color: "#15803d" },
  { min: 3.5, label: "Good",      bg: "#d1fae5", color: "#16a34a" },
  { min: 2.5, label: "Average",   bg: "#fef9c3", color: "#a16207" },
  { min: 1.5, label: "Needs work",bg: "#ffedd5", color: "#c2410c" },
  { min: 0,   label: "Urgent",    bg: "#fee2e2", color: "#dc2626" },
];

export default function ScoreBadge({ score }: Props) {
  const level = LEVELS.find((l) => score >= l.min) ?? LEVELS[LEVELS.length - 1];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: level.bg, color: level.color }}
    >
      {score.toFixed(1)} · {level.label}
    </span>
  );
}
