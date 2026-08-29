"use client";

import type { SensitivityPoint } from "@/app/lib/analysis";
import { usd, pct } from "@/app/components/analyzerUi";

// Shows profit and margin across five ARV scenarios (−10% to +10%) so an
// investor can see how much room for error they have on the deal.
export default function SensitivityPanel({ rows }: { rows: SensitivityPoint[] }) {
  const baseRow = rows.find((r) => r.pctDelta === 0);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-1">
        ARV Sensitivity
      </h2>
      <p className="text-xs text-slate-600 mb-4">
        What happens to profit if the ARV comes in higher or lower than expected
        {baseRow && ` — your base case is ${usd(baseRow.arv)}`}?
      </p>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left font-medium pb-2 px-1">Scenario</th>
              <th className="text-right font-medium pb-2 px-1">ARV</th>
              <th className="text-right font-medium pb-2 px-1">Profit</th>
              <th className="text-right font-medium pb-2 px-1 hidden sm:table-cell">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBase = row.pctDelta === 0;
              const label =
                row.pctDelta === 0
                  ? "Base case"
                  : row.pctDelta < 0
                  ? `−${Math.abs(row.pctDelta)}% ARV`
                  : `+${row.pctDelta}% ARV`;
              return (
                <tr
                  key={row.pctDelta}
                  className={`border-t border-slate-800/60 ${
                    isBase ? "bg-accent-500/5" : ""
                  }`}
                >
                  <td className="py-2 px-1">
                    <span
                      className={`font-medium ${
                        isBase ? "text-accent-300" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                    {isBase && (
                      <span className="ml-1.5 text-[10px] font-bold text-accent-500">
                        ●
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-1 text-right text-slate-300 tabular-nums">
                    {usd(row.arv)}
                  </td>
                  <td
                    className={`py-2 px-1 text-right font-medium tabular-nums ${
                      row.positive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {row.profit >= 0 ? "+" : "−"}
                    {usd(Math.abs(row.profit))}
                  </td>
                  <td
                    className={`py-2 px-1 text-right tabular-nums hidden sm:table-cell ${
                      row.positive ? "text-slate-400" : "text-red-400/70"
                    }`}
                  >
                    {pct(row.margin, 1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
