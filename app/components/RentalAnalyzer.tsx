"use client";

import { useMemo } from "react";
import type { DealForm, HoldFinancing } from "@/app/lib/types";
import { computeRental, HOLD_DEFAULTS, DEFAULT_ASSUMPTIONS } from "@/app/lib/analysis";
import {
  usd,
  usdExact,
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
  SignedTotalRow,
  RuleCard,
  VerdictCard,
  LabelText,
  CollapsibleSection,
} from "@/app/components/analyzerUi";

export interface StrategyAnalyzerProps {
  form: DealForm;
  onFormChange: (form: DealForm) => void;
  rehabFromScope: number | null;
  onGoToScope: () => void;
  // Photo / strategy picker / address block rendered by DealAnalyzer
  common: React.ReactNode;
}

const HOLD_FINANCING_OPTIONS = [
  { key: "loan" as HoldFinancing, label: "Financed" },
  { key: "cash" as HoldFinancing, label: "Cash" },
];

export default function RentalAnalyzer({
  form,
  onFormChange,
  rehabFromScope,
  onGoToScope,
  common,
}: StrategyAnalyzerProps) {
  const set = (patch: Partial<DealForm>) => onFormChange({ ...form, ...patch });
  const financing: HoldFinancing = form.holdFinancing ?? "loan";

  const results = useMemo(() => computeRental(form, rehabFromScope), [form, rehabFromScope]);

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
              placeholder="250000"
              onChange={(v) => set({ purchasePrice: v })}
            />
            <MoneyField
              label="Monthly Rent"
              value={form.monthlyRent ?? ""}
              placeholder="2200"
              onChange={(v) => set({ monthlyRent: v })}
            />
            <RehabField
              value={form.rehabBudget}
              onChange={(v) => set({ rehabBudget: v })}
              rehabFromScope={rehabFromScope}
              onGoToScope={onGoToScope}
            />
            <MoneyField
              label="Taxes / mo"
              value={form.monthlyTaxes ?? ""}
              placeholder="250"
              onChange={(v) => set({ monthlyTaxes: v })}
            />
            <MoneyField
              label="Insurance / mo"
              value={form.monthlyInsurance ?? ""}
              placeholder="120"
              onChange={(v) => set({ monthlyInsurance: v })}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SuffixField
                  label="Down"
                  value={form.downPaymentPct ?? ""}
                  placeholder={String(HOLD_DEFAULTS.downPaymentPct)}
                  suffix="%"
                  step="1"
                  onChange={(v) => set({ downPaymentPct: v })}
                />
                <SuffixField
                  label="Rate"
                  value={form.loanRatePct ?? ""}
                  placeholder={String(HOLD_DEFAULTS.loanRatePct)}
                  suffix="%"
                  step="0.125"
                  onChange={(v) => set({ loanRatePct: v })}
                />
                <SuffixField
                  label="Term"
                  value={form.loanTermYears ?? ""}
                  placeholder={String(HOLD_DEFAULTS.loanTermYears)}
                  suffix="yrs"
                  step="1"
                  onChange={(v) => set({ loanTermYears: v })}
                />
              </div>
            </div>
          )}
        </InputCard>

        {/* Editable assumptions */}
        <CollapsibleSection
          title="Assumptions"
          onReset={() =>
            set({ buyClosingPct: "", vacancyPct: "", maintenancePct: "", managementPct: "" })
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AssumptionField
              label="Buy closing"
              value={form.buyClosingPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.buyClosingPct)}
              onChange={(v) => set({ buyClosingPct: v })}
            />
            <AssumptionField
              label="Vacancy"
              value={form.vacancyPct ?? ""}
              placeholder={String(HOLD_DEFAULTS.vacancyPct)}
              onChange={(v) => set({ vacancyPct: v })}
            />
            <AssumptionField
              label="Maintenance"
              value={form.maintenancePct ?? ""}
              placeholder={String(HOLD_DEFAULTS.maintenancePct)}
              onChange={(v) => set({ maintenancePct: v })}
            />
            <AssumptionField
              label="Management"
              value={form.managementPct ?? ""}
              placeholder={String(HOLD_DEFAULTS.managementPct)}
              onChange={(v) => set({ managementPct: v })}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Vacancy, maintenance, and management are % of monthly rent. Blank fields use the
            defaults shown.
          </p>
        </CollapsibleSection>
      </section>

      {/* ── RESULTS ── */}
      <section className="space-y-4">
        {results ? (
          <>
            <VerdictCard
              address={form.address.trim()}
              amount={usd(Math.abs(results.monthlyCashFlow))}
              positive={results.monthlyCashFlow > 0}
              badge={results.monthlyCashFlow > 0 ? "▲ Cash-flows" : "▼ Negative"}
              caption={`Monthly cash flow · ${usd(results.annualCashFlow)}/yr on ${usd(
                results.cashInvested
              )} invested`}
            />

            <ResultCard title="Investment Breakdown">
              <div className="space-y-0.5">
                <CostRow label="Purchase Price" value={results.purchasePrice} />
                <CostRow
                  label={rehabFromScope !== null ? "Rehab Budget (from scope)" : "Rehab Budget"}
                  value={results.rehabBudget}
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
                      label={`Loan Amount (${results.assumptions.loanRatePct}% / ${results.assumptions.loanTermYears} yrs)`}
                      value={results.loanAmount}
                      muted
                    />
                  </>
                )}
              </div>
              <TotalRow label="Cash Invested" value={results.cashInvested} />
              <p className="text-xs text-slate-600 mt-2">
                {results.financed
                  ? "Down payment + rehab + closing costs out of pocket."
                  : "All-cash purchase — full project cost out of pocket."}
              </p>
            </ResultCard>

            <ResultCard title="Monthly Cash Flow">
              <div className="space-y-0.5">
                <CostRow label="Gross Rent" value={results.grossRent} />
                <CostRow
                  label={`− Vacancy (${results.assumptions.vacancyPct}%)`}
                  value={results.vacancyLoss}
                  muted
                />
                <CostRow
                  label={`− Maintenance (${results.assumptions.maintenancePct}%)`}
                  value={results.maintenanceCost}
                  muted
                />
                <CostRow
                  label={`− Management (${results.assumptions.managementPct}%)`}
                  value={results.managementCost}
                  muted
                />
                <CostRow label="− Property Taxes" value={results.taxes} muted />
                <CostRow label="− Insurance" value={results.insurance} muted />
                <CostRow label="Net Operating Income / mo" value={results.noiMonthly} />
                {results.financed && (
                  <CostRow label="− Mortgage (P&I)" value={results.monthlyPI} muted />
                )}
              </div>
              <SignedTotalRow
                label="Cash Flow / mo"
                value={usdExact(results.monthlyCashFlow)}
                positive={results.monthlyCashFlow >= 0}
              />
            </ResultCard>

            <MetricGrid
              metrics={[
                {
                  label: "Cash Flow / yr",
                  value: usd(results.annualCashFlow),
                  positive: results.annualCashFlow > 0,
                  sub: "after debt service",
                },
                {
                  label: "Cap Rate",
                  value: pct(results.capRate),
                  positive: results.capRate > 0,
                  sub: "NOI ÷ project cost",
                },
                {
                  label: "Cash-on-Cash",
                  value: pct(results.cashOnCash),
                  positive: results.cashOnCash > 0,
                  sub: "on cash invested",
                },
              ]}
            />

            <RuleCard
              passes={results.onePercentPasses}
              title="1% Rule"
              subtitle="Target monthly rent"
              value={usd(results.onePercentTarget)}
              footnote="(Purchase + Rehab) × 1%"
              failMessage={`Rent is ${usd(
                results.onePercentTarget - results.grossRent
              )}/mo short of the 1% target`}
            />
          </>
        ) : (
          <EmptyState subtitle="Fill in purchase price and monthly rent" />
        )}
      </section>
    </div>
  );
}
