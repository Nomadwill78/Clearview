"use client";

// Shared formatting helpers and small input/display components used by every
// strategy analyzer (Flip, Rental, BRRRR, Commercial).

export function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Exact dollars-and-cents, for small per-day/per-month figures where rounding
// to whole dollars would hide the number the user is sanity-checking against.
export function usdExact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function inputClass(extra = "") {
  return `w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition text-sm ${extra}`;
}

export function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
      {children}
    </span>
  );
}

// Dollar-prefixed number input.
export function MoneyField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <LabelText>{label}</LabelText>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
          $
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          className={inputClass("pl-6 pr-3")}
        />
      </div>
    </div>
  );
}

// Number input with a trailing unit label (%, days, yrs …).
export function SuffixField({
  label,
  value,
  placeholder,
  suffix,
  onChange,
  step,
}: {
  label: string;
  value: string;
  placeholder: string;
  suffix: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div>
      <LabelText>{label}</LabelText>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          step={step}
          className={inputClass("pl-3 pr-12")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
          {suffix}
        </span>
      </div>
    </div>
  );
}

// Compact percent field used inside the Assumptions panel.
export function AssumptionField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="0"
          step="0.5"
          className={inputClass("pl-3 pr-7")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
          %
        </span>
      </div>
    </div>
  );
}

export function CostRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60 last:border-0">
      <span className={`text-sm ${muted ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
      <span
        className={`font-medium tabular-nums text-sm ${muted ? "text-slate-500" : "text-slate-200"}`}
      >
        {usd(value)}
      </span>
    </div>
  );
}

// Segmented control (financing toggles, strategy picker).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-slate-700 overflow-hidden">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            value === key
              ? "bg-accent-500 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// The one loud read at the top of every strategy's results column.
export function VerdictCard({
  address,
  amount,
  positive,
  badge,
  caption,
  signed = true,
}: {
  address: string;
  amount: string;
  positive: boolean;
  badge: string;
  caption: string;
  // Flip/cash-flow numbers carry a +/− sign; balances like "cash left in" don't.
  signed?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${positive ? "bg-emerald-500" : "bg-red-500"}`}
      />
      <div className="p-5 pl-6">
        <div className="text-xs text-slate-500 truncate">{address || "Untitled deal"}</div>
        <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
          <span
            className={`font-mono text-3xl sm:text-[2.75rem] leading-none font-semibold tabular-nums tracking-tight ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {signed ? (positive ? "+" : "−") : ""}
            {amount}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              positive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {badge}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">{caption}</div>
      </div>
    </div>
  );
}

export interface Metric {
  label: string;
  value: string;
  positive: boolean;
  sub: string;
}

// The 3-up headline metric cards under the results stack.
export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map(({ label, value, positive, sub }) => (
        <div
          key={label}
          className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col items-center text-center"
        >
          <div
            className={`font-mono text-lg sm:text-xl font-bold tabular-nums leading-tight ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {value}
          </div>
          <div className="text-xs text-slate-300 font-medium mt-1">{label}</div>
          <div className="text-xs text-slate-600 mt-0.5 hidden sm:block">{sub}</div>
        </div>
      ))}
    </div>
  );
}

// Placeholder shown in the results column until the inputs are valid.
export function EmptyState({ subtitle }: { subtitle: string }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 flex flex-col items-center justify-center text-center min-h-64">
      <div className="w-14 h-14 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
        <span className="text-accent-400/60 text-2xl">◈</span>
      </div>
      <p className="text-slate-300 font-medium">Enter deal details to see results</p>
      <p className="text-slate-600 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

// Rehab budget input that switches to the scope-linked read-only button when
// the Scope Builder has priced line items.
export function RehabField({
  label = "Rehab Budget",
  value,
  onChange,
  rehabFromScope,
  onGoToScope,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rehabFromScope: number | null;
  onGoToScope: () => void;
}) {
  const scopeLinked = rehabFromScope !== null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-xs text-slate-400 uppercase tracking-wider font-medium">
          {label}
        </span>
        {scopeLinked && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-500/15 text-accent-400 border border-accent-800/60 leading-none">
            FROM SCOPE
          </span>
        )}
      </div>
      {scopeLinked ? (
        <button
          onClick={onGoToScope}
          title="Itemized in the Scope Builder — click to edit"
          className="w-full bg-slate-800/60 border border-accent-900/50 rounded-lg py-2.5 px-3 text-left text-sm text-accent-300 font-medium tabular-nums hover:border-accent-600 transition"
        >
          {usd(rehabFromScope)}
        </button>
      ) : (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
            $
          </span>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="45000"
            min="0"
            className={inputClass("pl-6 pr-3")}
          />
        </div>
      )}
    </div>
  );
}

// "Rehab budget is synced" hint under the input grid.
export function ScopeSyncHint({
  rehabFromScope,
  onGoToScope,
}: {
  rehabFromScope: number | null;
  onGoToScope: () => void;
}) {
  if (rehabFromScope === null) return null;
  return (
    <p className="text-xs text-slate-500 -mt-2 mb-4">
      Rehab budget is synced from your itemized scope.{" "}
      <button onClick={onGoToScope} className="text-accent-400 hover:text-accent-300 font-medium">
        Edit scope →
      </button>
    </p>
  );
}

// Card shells so every strategy's panels look identical.
export function InputCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <h2 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-4">
        Deal Inputs
      </h2>
      {children}
    </div>
  );
}

export function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <h2 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

// Bold accent total row at the bottom of a ResultCard stack.
export function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-700">
      <span className="font-semibold text-slate-200">{label}</span>
      <span className="font-mono font-bold tabular-nums text-accent-400 text-lg">{usd(value)}</span>
    </div>
  );
}

// Total row that reads green/red instead of accent — for cash-flow bottom lines.
export function SignedTotalRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-700">
      <span className="font-semibold text-slate-200">{label}</span>
      <span
        className={`font-mono font-bold tabular-nums text-lg ${
          positive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// Pass/fail rule-of-thumb card (70% rule, 1% rule …).
export function RuleCard({
  passes,
  title,
  subtitle,
  value,
  footnote,
  failMessage,
}: {
  passes: boolean;
  title: string;
  subtitle: string;
  value: string;
  footnote: string;
  failMessage?: string | null;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        passes ? "bg-emerald-950/40 border-emerald-800/60" : "bg-red-950/40 border-red-800/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
            passes ? "bg-emerald-500 text-emerald-950" : "bg-red-500 text-red-950"
          }`}
        >
          {passes ? "✓" : "✗"}
        </span>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
      </div>
      <div className="text-xs text-slate-500 mb-1">{subtitle}</div>
      <div
        className={`font-mono text-base font-bold tabular-nums ${
          passes ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-600 mt-1">{footnote}</div>
      {!passes && failMessage && (
        <div className="text-xs font-medium text-red-300 mt-1.5">{failMessage}</div>
      )}
    </div>
  );
}

// Neutral info card that mirrors RuleCard's shape (Daily Hold Cost, Equity …).
export function InfoCard({
  icon,
  title,
  subtitle,
  value,
  footnote,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  footnote: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs">
          {icon}
        </span>
        <span className="text-sm font-semibold text-slate-200">{title}</span>
      </div>
      <div className="text-xs text-slate-500 mb-1">{subtitle}</div>
      <div className="font-mono text-base font-bold tabular-nums text-accent-300">{value}</div>
      <div className="text-xs text-slate-600 mt-1">{footnote}</div>
    </div>
  );
}
