"use client";

import { useMemo } from "react";
import type { DealForm, FinancingType } from "@/app/lib/types";
import {
  computeBrrrr,
  HOLD_DEFAULTS,
  REFI_DEFAULTS,
  DEFAULT_ASSUMPTIONS,
} from "@/app/lib/analysis";
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
  VerdictCard,
  LabelText,
} from "@/app/components/analyzerUi";
import type { StrategyAnalyzerProps } from "@/app/components/RentalAnalyzer";

const PURCHASE_FINANCING_OPTIONS = [
  { key: "cash" as FinancingType, label: "Cash" },
  { key: "hardmoney" as FinancingType, label: "Hard Money" },
];

export default function BrrrrAnalyzer({
  form,
  onFormChange,
  rehabFromScope,
  onGoToScope,
  common,
}: StrategyAnalyzerProps) {
  const set = (patch: Partial<DealForm>) => onFormChange({ ...form, ...patch });
  const isHM = form.financingType === "hardmoney";

  const results = useMemo(() => computeBrrrr(form, rehabFromScope), [form, rehabFromScope]);

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
              label="ARV (after rehab)"
              value={form.arv}
              placeholder="380000"
              onChange={(v) => set({ arv: v })}
            />
            <RehabField
              value={form.rehabBudget}
              onChange={(v) => set({ rehabBudget: v })}
              rehabFromScope={rehabFromScope}
              onGoToScope={onGoToScope}
            />
            <SuffixField
              label="Rehab Period"
              value={form.holdingDays}
              placeholder="90"
              suffix="days"
              onChange={(v) => set({ holdingDays: v })}
            />
            <MoneyField
              label="Monthly Rent"
              value={form.monthlyRent ?? ""}
              placeholder="2200"
              onChange={(v) => set({ monthlyRent: v })}
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

          {/* Purchase financing toggle */}
          <div className="mb-4">
            <LabelText>Purchase Financing</LabelText>
            <Segmented
              options={PURCHASE_FINANCING_OPTIONS}
              value={form.financingType}
              onChange={(financingType) => set({ financingType })}
            />
          </div>

          {isHM && (
            <div className="rounded-lg border border-accent-900/40 bg-accent-950/20 p-3 mb-4">
              <p className="text-xs text-accent-600/80 mb-3 uppercase tracking-wider font-medium">
                Hard Money Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SuffixField
                  label="Annual Rate"
                  value={form.hardMoneyRate}
                  placeholder="12"
                  suffix="%"
                  step="0.5"
                  onChange={(v) => set({ hardMoneyRate: v })}
                />
                <SuffixField
                  label="Points"
                  value={form.hardMoneyPoints}
                  placeholder="2"
                  suffix="%"
                  step="0.5"
                  onChange={(v) => set({ hardMoneyPoints: v })}
                />
              </div>
            </div>
          )}

          {/* Refinance terms */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-medium">
              Refinance Terms
            </p>
            <div className="grid grid-cols-3 gap-3">
              <SuffixField
                label="LTV"
                value={form.refiLtvPct ?? ""}
                placeholder={String(REFI_DEFAULTS.ltvPct)}
                suffix="%"
                step="1"
                onChange={(v) => set({ refiLtvPct: v })}
              />
              <SuffixField
                label="Rate"
                value={form.refiRatePct ?? ""}
                placeholder={String(REFI_DEFAULTS.ratePct)}
                suffix="%"
                step="0.125"
                onChange={(v) => set({ refiRatePct: v })}
              />
              <SuffixField
                label="Term"
                value={form.refiTermYears ?? ""}
                placeholder={String(REFI_DEFAULTS.termYears)}
                suffix="yrs"
                step="1"
                onChange={(v) => set({ refiTermYears: v })}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2.5">
              The new loan is ARV × LTV — that&apos;s the cash-out that pays you back.
            </p>
          </div>
        </InputCard>

        {/* Editable assumptions */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Assumptions
            </p>
            <button
              onClick={() =>
                set({
                  buyClosingPct: "",
                  monthlyCarryPct: "",
                  vacancyPct: "",
                  maintenancePct: "",
                  managementPct: "",
                  refiClosingPct: "",
                })
              }
              className="text-[10px] font-medium text-slate-500 hover:text-accent-400 transition-colors"
            >
              Reset defaults
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <AssumptionField
              label="Buy closing"
              value={form.buyClosingPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.buyClosingPct)}
              onChange={(v) => set({ buyClosingPct: v })}
            />
            <AssumptionField
              label="Carry / mo"
              value={form.monthlyCarryPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.monthlyCarryPct)}
              onChange={(v) => set({ monthlyCarryPct: v })}
            />
            <AssumptionField
              label="Vacancy"
              value={form.vacancyPct ?? ""}
              placeholder={String(HOLD_DEFAULTS.vacancyPct)}
              onChange={(v) => set({ vacancyPct: v })}
            />
            <AssumptionField
              label="Maint."
              value={form.maintenancePct ?? ""}
              placeholder={String(HOLD_DEFAULTS.maintenancePct)}
              onChange={(v) => set({ maintenancePct: v })}
            />
            <AssumptionField
              label="Mgmt."
              value={form.managementPct ?? ""}
              placeholder={String(HOLD_DEFAULTS.managementPct)}
              onChange={(v) => set({ managementPct: v })}
            />
            <AssumptionField
              label="Refi closing"
              value={form.refiClosingPct ?? ""}
              placeholder={String(REFI_DEFAULTS.closingPct)}
              onChange={(v) => set({ refiClosingPct: v })}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Vacancy, maintenance, and management are % of monthly rent; refi closing is % of the
            new loan. Blank fields use the defaults shown.
          </p>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="space-y-4">
        {results ? (
          <>
            <VerdictCard
              address={form.address.trim()}
              amount={usd(Math.abs(results.cashLeftInDeal))}
              positive={results.cashLeftInDeal <= 0}
              badge={results.cashLeftInDeal <= 0 ? "▲ All capital out" : "◆ Capital stuck"}
              signed={false}
              caption={
                results.cashLeftInDeal <= 0
                  ? "Cash pulled out above your all-in cost — infinite return"
                  : "Cash left in the deal after the refinance"
              }
            />

            <ResultCard title="All-In Cost (Buy + Rehab)">
              <div className="space-y-0.5">
                <CostRow label="Purchase Price" value={results.costStack.purchasePrice} />
                <CostRow
                  label={rehabFromScope !== null ? "Rehab Budget (from scope)" : "Rehab Budget"}
                  value={results.costStack.rehabBudget}
                />
                <CostRow
                  label={`Buy Closing Costs (${results.assumptions.buyClosingPct}%)`}
                  value={results.costStack.buyClosingCosts}
                />
                <CostRow
                  label={`Carrying Costs (${results.assumptions.monthlyCarryPct}%/mo)`}
                  value={results.costStack.carryingCosts}
                />
                {isHM && (
                  <>
                    <CostRow
                      label={`Hard Money Interest (${form.hardMoneyRate}% APR)`}
                      value={results.costStack.hardMoneyInterest}
                    />
                    <CostRow
                      label={`Hard Money Points (${form.hardMoneyPoints}%)`}
                      value={results.costStack.hardMoneyPointsCost}
                    />
                  </>
                )}
              </div>
              <TotalRow label="Total Invested" value={results.costStack.total} />
            </ResultCard>

            <ResultCard title="Refinance & Cash Out">
              <div className="space-y-0.5">
                <CostRow
                  label={`New Loan (${results.assumptions.refiLtvPct}% of ARV)`}
                  value={results.refiLoan}
                />
                <CostRow
                  label={`− Refi Closing (${results.assumptions.refiClosingPct}%)`}
                  value={results.refiClosingCosts}
                  muted
                />
                <CostRow label="Cash Back at Refi" value={results.cashBack} />
                <CostRow label="Equity After Refi" value={results.equityAfterRefi} muted />
              </div>
              <SignedTotalRow
                label={results.cashLeftInDeal > 0 ? "Cash Left in Deal" : "Cash-Out Above All-In"}
                value={usd(Math.abs(results.cashLeftInDeal))}
                positive={results.cashLeftInDeal <= 0}
              />
              {results.cashLeftInDeal <= 0 && (
                <p className="text-xs text-emerald-500/80 mt-2">
                  The refi returns all of your capital — the classic BRRRR home run.
                </p>
              )}
            </ResultCard>

            <ResultCard title="Monthly Cash Flow (After Refi)">
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
                <CostRow
                  label={`− New Mortgage (${results.assumptions.refiRatePct}% / ${results.assumptions.refiTermYears} yrs)`}
                  value={results.monthlyPI}
                  muted
                />
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
                  label: "Cash Flow / mo",
                  value: usd(results.monthlyCashFlow),
                  positive: results.monthlyCashFlow > 0,
                  sub: `${usd(results.annualCashFlow)}/yr`,
                },
                {
                  label: "Cash Left In",
                  value: results.cashLeftInDeal <= 0 ? "$0" : usd(results.cashLeftInDeal),
                  positive: results.cashLeftInDeal <= 0,
                  sub: "after the refi",
                },
                {
                  label: "Cash-on-Cash",
                  value:
                    results.cashOnCash === null
                      ? results.annualCashFlow > 0
                        ? "∞"
                        : "—"
                      : pct(results.cashOnCash),
                  positive:
                    results.cashOnCash === null
                      ? results.annualCashFlow > 0
                      : results.cashOnCash > 0,
                  sub:
                    results.cashOnCash === null ? "no cash left in deal" : "on cash left in deal",
                },
              ]}
            />
          </>
        ) : (
          <EmptyState subtitle="Fill in purchase price, ARV, rehab period, and monthly rent" />
        )}
      </section>
    </div>
  );
}
