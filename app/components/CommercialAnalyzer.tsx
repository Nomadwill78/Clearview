"use client";

import { useMemo } from "react";
import type { DealForm, HoldFinancing } from "@/app/lib/types";
import { computeCommercial, COMMERCIAL_DEFAULTS, DEFAULT_ASSUMPTIONS } from "@/app/lib/analysis";
import {
  usd,
  pct,
  MoneyField,
  SuffixField,
  AssumptionField,
  CostRow,
  Segmented,
  MetricGrid,
  EmptyState,
  RehabField,
  ScopeSyncHint,
  InputCard,
  ResultCard,
  TotalRow,
  RuleCard,
  VerdictCard,
  LabelText,
} from "@/app/components/analyzerUi";
import type { StrategyAnalyzerProps } from "@/app/components/RentalAnalyzer";

const HOLD_FINANCING_OPTIONS = [
  { key: "loan" as HoldFinancing, label: "Financed" },
  { key: "cash" as HoldFinancing, label: "Cash" },
];

export default function CommercialAnalyzer({
  form,
  onFormChange,
  rehabFromScope,
  onGoToScope,
  common,
}: StrategyAnalyzerProps) {
  const set = (patch: Partial<DealForm>) => onFormChange({ ...form, ...patch });
  const financing: HoldFinancing = form.holdFinancing ?? "loan";

  const results = useMemo(() => computeCommercial(form, rehabFromScope), [form, rehabFromScope]);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 space-y-6 lg:space-y-0">
      {/* ── INPUTS ── */}
      <section className="space-y-4">
        <InputCard>
          {common}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <MoneyField
              label="Purchase Price"
              value={form.purchasePrice}
              placeholder="1200000"
              onChange={(v) => set({ purchasePrice: v })}
            />
            <MoneyField
              label="Gross Income / yr"
              value={form.grossAnnualIncome ?? ""}
              placeholder="150000"
              onChange={(v) => set({ grossAnnualIncome: v })}
            />
            <RehabField
              label="CapEx / Rehab"
              value={form.rehabBudget}
              onChange={(v) => set({ rehabBudget: v })}
              rehabFromScope={rehabFromScope}
              onGoToScope={onGoToScope}
            />
            <MoneyField
              label="Op. Expenses / yr"
              value={form.annualOperatingExpenses ?? ""}
              placeholder="60000"
              onChange={(v) => set({ annualOperatingExpenses: v })}
            />
            <SuffixField
              label="Market Cap Rate"
              value={form.marketCapRatePct ?? ""}
              placeholder="optional"
              suffix="%"
              step="0.25"
              onChange={(v) => set({ marketCapRatePct: v })}
            />
          </div>

          <ScopeSyncHint rehabFromScope={rehabFromScope} onGoToScope={onGoToScope} />

          {/* Financing toggle */}
          <div className="mb-4">
            <LabelText>Financing Type</LabelText>
            <Segmented
              options={HOLD_FINANCING_OPTIONS}
              value={financing}
              onChange={(holdFinancing) => set({ holdFinancing })}
            />
          </div>

          {financing === "loan" && (
            <div className="rounded-lg border border-accent-900/40 bg-accent-950/20 p-3">
              <p className="text-xs text-accent-600/80 mb-3 uppercase tracking-wider font-medium">
                Loan Terms
              </p>
              <div className="grid grid-cols-3 gap-3">
                <SuffixField
                  label="Down"
                  value={form.downPaymentPct ?? ""}
                  placeholder={String(COMMERCIAL_DEFAULTS.downPaymentPct)}
                  suffix="%"
                  step="1"
                  onChange={(v) => set({ downPaymentPct: v })}
                />
                <SuffixField
                  label="Rate"
                  value={form.loanRatePct ?? ""}
                  placeholder={String(COMMERCIAL_DEFAULTS.loanRatePct)}
                  suffix="%"
                  step="0.125"
                  onChange={(v) => set({ loanRatePct: v })}
                />
                <SuffixField
                  label="Amortization"
                  value={form.loanTermYears ?? ""}
                  placeholder={String(COMMERCIAL_DEFAULTS.loanTermYears)}
                  suffix="yrs"
                  step="1"
                  onChange={(v) => set({ loanTermYears: v })}
                />
              </div>
            </div>
          )}
        </InputCard>

        {/* Editable assumptions */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Assumptions
            </p>
            <button
              onClick={() => set({ buyClosingPct: "", vacancyPct: "" })}
              className="text-[10px] font-medium text-slate-500 hover:text-accent-400 transition-colors"
            >
              Reset defaults
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AssumptionField
              label="Buy closing"
              value={form.buyClosingPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.buyClosingPct)}
              onChange={(v) => set({ buyClosingPct: v })}
            />
            <AssumptionField
              label="Vacancy"
              value={form.vacancyPct ?? ""}
              placeholder={String(COMMERCIAL_DEFAULTS.vacancyPct)}
              onChange={(v) => set({ vacancyPct: v })}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Vacancy is % of gross income. Leave operating expenses blank to estimate them at{" "}
            {COMMERCIAL_DEFAULTS.opexPctOfEgi}% of effective gross income.
          </p>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="space-y-4">
        {results ? (
          <>
            <VerdictCard
              address={form.address.trim()}
              amount={usd(Math.abs(results.annualCashFlow))}
              positive={results.annualCashFlow > 0}
              badge={results.annualCashFlow > 0 ? "▲ Cash-flows" : "▼ Negative"}
              caption={`Annual cash flow after debt service · ${pct(results.capRate)} cap rate`}
            />

            <ResultCard title="Income & NOI">
              <div className="space-y-0.5">
                <CostRow label="Gross Annual Income" value={results.grossAnnualIncome} />
                <CostRow
                  label={`− Vacancy (${results.assumptions.vacancyPct}%)`}
                  value={results.vacancyLoss}
                  muted
                />
                <CostRow label="Effective Gross Income" value={results.effectiveGrossIncome} />
                <CostRow
                  label={
                    results.opexEstimated
                      ? `− Operating Expenses (est. ${COMMERCIAL_DEFAULTS.opexPctOfEgi}% of EGI)`
                      : "− Operating Expenses"
                  }
                  value={results.operatingExpenses}
                  muted
                />
              </div>
              <TotalRow label="Net Operating Income" value={results.noi} />
              {results.opexEstimated && (
                <p className="text-xs text-slate-600 mt-2">
                  Enter real operating expenses for an accurate NOI — the{" "}
                  {COMMERCIAL_DEFAULTS.opexPctOfEgi}% estimate is a rule of thumb.
                </p>
              )}
            </ResultCard>

            <ResultCard title="Investment & Debt">
              <div className="space-y-0.5">
                <CostRow label="Purchase Price" value={results.purchasePrice} />
                <CostRow
                  label={rehabFromScope !== null ? "CapEx (from scope)" : "CapEx / Rehab"}
                  value={results.capexBudget}
                />
                <CostRow
                  label={`Buy Closing Costs (${results.assumptions.buyClosingPct}%)`}
                  value={results.buyClosingCosts}
                />
                {results.financed && (
                  <>
                    <CostRow
                      label={`Down Payment (${results.assumptions.downPaymentPct}%)`}
                      value={results.downPayment}
                    />
                    <CostRow
                      label={`Loan (${results.assumptions.loanRatePct}% / ${results.assumptions.loanTermYears} yr am.)`}
                      value={results.loanAmount}
                      muted
                    />
                    <CostRow label="Annual Debt Service" value={results.annualDebtService} muted />
                  </>
                )}
              </div>
              <TotalRow label="Cash Invested" value={results.cashInvested} />
            </ResultCard>

            <MetricGrid
              metrics={[
                {
                  label: "Cap Rate",
                  value: pct(results.capRate),
                  positive: results.capRate > 0,
                  sub: "NOI ÷ project cost",
                },
                {
                  label: results.dscr !== null ? "DSCR" : "Cash Flow / yr",
                  value:
                    results.dscr !== null ? results.dscr.toFixed(2) : usd(results.annualCashFlow),
                  positive:
                    results.dscr !== null ? results.dscr >= 1.2 : results.annualCashFlow > 0,
                  sub: results.dscr !== null ? "lenders want ≥ 1.20" : "no debt service",
                },
                {
                  label: "Cash-on-Cash",
                  value: pct(results.cashOnCash),
                  positive: results.cashOnCash > 0,
                  sub: `${usd(results.annualCashFlow)}/yr cash flow`,
                },
              ]}
            />

            {results.marketValue !== null && results.marketCapRatePct !== null && (
              <RuleCard
                passes={results.marketValue >= results.totalProjectCost}
                title={`Value at ${pct(results.marketCapRatePct, 2)} Market Cap`}
                subtitle="NOI ÷ market cap rate"
                value={usd(results.marketValue)}
                footnote={`vs ${usd(results.totalProjectCost)} total project cost`}
                failMessage={`You'd be paying ${usd(
                  results.totalProjectCost - results.marketValue
                )} above the income-based value`}
              />
            )}
          </>
        ) : (
          <EmptyState subtitle="Fill in purchase price and gross annual income" />
        )}
      </section>
    </div>
  );
}
