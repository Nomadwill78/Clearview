"use client";

import { useMemo } from "react";
import type { DealForm, FinancingType } from "@/app/lib/types";
import { parseUserNumber } from "@/app/lib/types";
import { MainPhotoPicker } from "@/app/components/PhotoPicker";

interface CostStack {
  purchasePrice: number;
  rehabBudget: number;
  buyClosingCosts: number;
  sellClosingCosts: number;
  carryingCosts: number;
  hardMoneyInterest: number;
  hardMoneyPointsCost: number;
  total: number;
}

// Effective percents used in the math — echoes overrides or defaults so
// labels always describe the numbers actually applied.
export interface Assumptions {
  buyClosingPct: number;
  sellClosingPct: number;
  monthlyCarryPct: number;
  taxRatePct: number;
}

export interface Results {
  costStack: CostStack;
  grossProfit: number;
  roi: number;
  maxAllowable: number;
  seventyPctPasses: boolean;
  dailyHoldingCost: number;
  // Per-day components of dailyHoldingCost, for the card breakdown
  dailyCarry: number;
  dailyInterest: number;
  dailyPoints: number;
  netAfterTax: number;
  arvPct: number;
  costPct: number;
  assumptions: Assumptions;
}

// National-average defaults, used when a deal doesn't override them.
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  buyClosingPct: 1.5,
  sellClosingPct: 8,
  monthlyCarryPct: 0.5,
  taxRatePct: 32,
};

// Effective percent for an editable assumption: blank or invalid input falls
// back to the default; values are capped at 100%.
function assumptionPct(raw: string | undefined, fallback: number): number {
  const n = parseUserNumber(raw ?? "");
  return n === null ? fallback : Math.min(n, 100);
}

export function computeResults(form: DealForm, rehabFromScope: number | null): Results | null {
  const pp = parseFloat(form.purchasePrice);
  const rehab = rehabFromScope !== null ? rehabFromScope : parseFloat(form.rehabBudget);
  const arv = parseFloat(form.arv);
  const days = parseFloat(form.holdingDays);
  const isHM = form.financingType === "hardmoney";

  if ([pp, rehab, arv, days].some((v) => isNaN(v) || v < 0)) return null;
  if (pp <= 0 || arv <= 0 || days <= 0) return null;

  const assumptions: Assumptions = {
    buyClosingPct: assumptionPct(form.buyClosingPct, DEFAULT_ASSUMPTIONS.buyClosingPct),
    sellClosingPct: assumptionPct(form.sellClosingPct, DEFAULT_ASSUMPTIONS.sellClosingPct),
    monthlyCarryPct: assumptionPct(form.monthlyCarryPct, DEFAULT_ASSUMPTIONS.monthlyCarryPct),
    taxRatePct: assumptionPct(form.taxRatePct, DEFAULT_ASSUMPTIONS.taxRatePct),
  };

  const months = days / 30;
  const buyClose = pp * (assumptions.buyClosingPct / 100);
  const sellClose = arv * (assumptions.sellClosingPct / 100);
  const carry = pp * (assumptions.monthlyCarryPct / 100) * months;

  const hmRate = Math.max(0, parseFloat(form.hardMoneyRate) || 0);
  const hmPts = Math.max(0, parseFloat(form.hardMoneyPoints) || 0);
  const hmInterest = isHM ? pp * (hmRate / 100) * (days / 365) : 0;
  const hmPointsCost = isHM ? pp * (hmPts / 100) : 0;

  const total = pp + rehab + buyClose + sellClose + carry + hmInterest + hmPointsCost;
  const grossProfit = arv - total;
  const roi = (grossProfit / total) * 100;
  const maxAllowable = arv * 0.7 - rehab;
  const dailyHoldingCost = (carry + hmInterest + hmPointsCost) / days;
  const netAfterTax =
    grossProfit > 0 ? grossProfit * (1 - assumptions.taxRatePct / 100) : grossProfit;
  const costPct = (total / arv) * 100;
  const arvPct = Math.max(0, Math.min(100, costPct));

  return {
    costStack: {
      purchasePrice: pp,
      rehabBudget: rehab,
      buyClosingCosts: buyClose,
      sellClosingCosts: sellClose,
      carryingCosts: carry,
      hardMoneyInterest: hmInterest,
      hardMoneyPointsCost: hmPointsCost,
      total,
    },
    grossProfit,
    roi,
    maxAllowable,
    seventyPctPasses: pp <= maxAllowable,
    dailyHoldingCost,
    dailyCarry: carry / days,
    dailyInterest: hmInterest / days,
    dailyPoints: hmPointsCost / days,
    netAfterTax,
    arvPct,
    costPct,
    assumptions,
  };
}

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Exact dollars-and-cents, for small per-day figures where rounding to whole
// dollars would hide the number the user is sanity-checking against.
function usdExact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

function inputClass(extra = "") {
  return `w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition text-sm ${extra}`;
}

function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
      {children}
    </span>
  );
}

function AssumptionField({
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

function CostRow({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60 last:border-0">
      <span className={`text-sm ${muted ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
      <span className={`font-medium tabular-nums text-sm ${muted ? "text-slate-500" : "text-slate-200"}`}>
        {usd(value)}
      </span>
    </div>
  );
}

interface DealAnalyzerProps {
  form: DealForm;
  onFormChange: (form: DealForm) => void;
  rehabFromScope: number | null;
  onGoToScope: () => void;
  mainPhotoId: string | null | undefined;
  onMainPhotoChange: (photoId: string | null) => void;
}

export default function DealAnalyzer({
  form,
  onFormChange,
  rehabFromScope,
  onGoToScope,
  mainPhotoId,
  onMainPhotoChange,
}: DealAnalyzerProps) {
  function handle(field: keyof DealForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      onFormChange({ ...form, [field]: e.target.value });
  }

  function setFinancing(type: FinancingType) {
    onFormChange({ ...form, financingType: type });
  }

  const isHM = form.financingType === "hardmoney";
  const scopeLinked = rehabFromScope !== null;

  const results = useMemo(
    () => computeResults(form, rehabFromScope),
    [form, rehabFromScope]
  );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 space-y-6 lg:space-y-0">
      {/* ── INPUTS ── */}
      <section className="space-y-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-4">
            Deal Inputs
          </h2>

          {/* Property photo */}
          <MainPhotoPicker photoId={mainPhotoId} onChange={onMainPhotoChange} />

          {/* Address */}
          <div className="mb-4">
            <LabelText>Property Address</LabelText>
            <input
              type="text"
              value={form.address}
              onChange={handle("address")}
              placeholder="123 Main St, City, ST 00000"
              className={inputClass("px-3")}
            />
          </div>

          {/* 2-col price grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <LabelText>Purchase Price</LabelText>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  value={form.purchasePrice}
                  onChange={handle("purchasePrice")}
                  placeholder="250000"
                  min="0"
                  className={inputClass("pl-6 pr-3")}
                />
              </div>
            </div>
            <div>
              <LabelText>ARV</LabelText>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  value={form.arv}
                  onChange={handle("arv")}
                  placeholder="380000"
                  min="0"
                  className={inputClass("pl-6 pr-3")}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Rehab Budget
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
                    value={form.rehabBudget}
                    onChange={handle("rehabBudget")}
                    placeholder="45000"
                    min="0"
                    className={inputClass("pl-6 pr-3")}
                  />
                </div>
              )}
            </div>
            <div>
              <LabelText>Holding Period</LabelText>
              <div className="relative">
                <input
                  type="number"
                  value={form.holdingDays}
                  onChange={handle("holdingDays")}
                  placeholder="90"
                  min="1"
                  className={inputClass("pl-3 pr-12")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                  days
                </span>
              </div>
            </div>
          </div>

          {scopeLinked && (
            <p className="text-xs text-slate-500 -mt-2 mb-4">
              Rehab budget is synced from your itemized scope.{" "}
              <button onClick={onGoToScope} className="text-accent-400 hover:text-accent-300 font-medium">
                Edit scope →
              </button>
            </p>
          )}

          {/* Financing toggle */}
          <div className="mb-4">
            <LabelText>Financing Type</LabelText>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {(["cash", "hardmoney"] as FinancingType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFinancing(type)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    form.financingType === type
                      ? "bg-accent-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                  }`}
                >
                  {type === "cash" ? "Cash" : "Hard Money"}
                </button>
              ))}
            </div>
          </div>

          {/* Hard money options */}
          {isHM && (
            <div className="rounded-lg border border-accent-900/40 bg-accent-950/20 p-3">
              <p className="text-xs text-accent-600/80 mb-3 uppercase tracking-wider font-medium">
                Hard Money Terms
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <LabelText>Annual Rate</LabelText>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.hardMoneyRate}
                      onChange={handle("hardMoneyRate")}
                      placeholder="12"
                      min="0"
                      step="0.5"
                      className={inputClass("pl-3 pr-7")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <LabelText>Points</LabelText>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.hardMoneyPoints}
                      onChange={handle("hardMoneyPoints")}
                      placeholder="2"
                      min="0"
                      step="0.5"
                      className={inputClass("pl-3 pr-7")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editable assumptions */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Assumptions
            </p>
            <button
              onClick={() =>
                onFormChange({
                  ...form,
                  buyClosingPct: "",
                  sellClosingPct: "",
                  monthlyCarryPct: "",
                  taxRatePct: "",
                })
              }
              className="text-[10px] font-medium text-slate-500 hover:text-accent-400 transition-colors"
            >
              Reset defaults
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AssumptionField
              label="Buy closing"
              value={form.buyClosingPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.buyClosingPct)}
              onChange={(v) => onFormChange({ ...form, buyClosingPct: v })}
            />
            <AssumptionField
              label="Sell closing"
              value={form.sellClosingPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.sellClosingPct)}
              onChange={(v) => onFormChange({ ...form, sellClosingPct: v })}
            />
            <AssumptionField
              label="Carry / mo"
              value={form.monthlyCarryPct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.monthlyCarryPct)}
              onChange={(v) => onFormChange({ ...form, monthlyCarryPct: v })}
            />
            <AssumptionField
              label="Tax rate"
              value={form.taxRatePct ?? ""}
              placeholder={String(DEFAULT_ASSUMPTIONS.taxRatePct)}
              onChange={(v) => onFormChange({ ...form, taxRatePct: v })}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            Sell closing (% of ARV) covers agent commission plus transfer taxes &amp; fees — tune
            it to your market. Blank fields use the defaults shown.
          </p>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="space-y-4">
        {results ? (
          <>
            {/* Verdict — the one loud read on every deal */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
              <span
                className={`absolute inset-y-0 left-0 w-1 ${
                  results.grossProfit > 0 ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <div className="p-5 pl-6">
                <div className="text-xs text-slate-500 truncate">
                  {form.address.trim() || "Untitled deal"}
                </div>
                <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
                  <span
                    className={`font-mono text-3xl sm:text-[2.75rem] leading-none font-semibold tabular-nums tracking-tight ${
                      results.grossProfit > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {results.grossProfit >= 0 ? "+" : "−"}
                    {usd(Math.abs(results.grossProfit))}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      results.grossProfit > 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    {results.grossProfit > 0 ? "▲ Profitable" : "▼ Loss"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Projected gross profit · ARV {usd(parseFloat(form.arv))}
                </div>
              </div>
            </div>

            {/* Cost Stack */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h2 className="text-sm font-semibold text-accent-400 uppercase tracking-wider mb-4">
                Cost Stack Breakdown
              </h2>
              <div className="space-y-0.5">
                <CostRow label="Purchase Price" value={results.costStack.purchasePrice} />
                <CostRow
                  label={scopeLinked ? "Rehab Budget (from scope)" : "Rehab Budget"}
                  value={results.costStack.rehabBudget}
                />
                <CostRow
                  label={`Buy Closing Costs (${results.assumptions.buyClosingPct}%)`}
                  value={results.costStack.buyClosingCosts}
                />
                <CostRow
                  label={`Sell Closing Costs (${results.assumptions.sellClosingPct}% ARV)`}
                  value={results.costStack.sellClosingCosts}
                />
                <CostRow
                  label={`Carrying Costs (${results.assumptions.monthlyCarryPct}%/mo × ${parseFloat(form.holdingDays) > 0 ? (parseFloat(form.holdingDays) / 30).toFixed(1) : "0"}mo)`}
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
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-700">
                <span className="font-semibold text-slate-200">Total Cost Stack</span>
                <span className="font-mono font-bold tabular-nums text-accent-400 text-lg">
                  {usd(results.costStack.total)}
                </span>
              </div>

              {/* ARV cost bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Costs as % of ARV</span>
                  <span className="text-slate-400 tabular-nums">{pct(results.costPct)} of {usd(parseFloat(form.arv))}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      results.grossProfit > 0 ? "bg-accent-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, results.arvPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-600">$0</span>
                  <span
                    className={`font-medium tabular-nums ${
                      results.grossProfit > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {results.grossProfit >= 0 ? "+" : ""}
                    {pct((results.grossProfit / parseFloat(form.arv)) * 100)} margin
                  </span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "ROI",
                  value: pct(results.roi),
                  positive: results.roi > 0,
                  sub: "on total invested",
                },
                {
                  label: "Net After Tax",
                  value: usd(results.netAfterTax),
                  positive: results.netAfterTax > 0,
                  sub: `${results.assumptions.taxRatePct}% tax rate`,
                },
                {
                  label: "Margin",
                  value: pct((results.grossProfit / parseFloat(form.arv)) * 100),
                  positive: results.grossProfit > 0,
                  sub: "of ARV",
                },
              ].map(({ label, value, positive, sub }) => (
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

            {/* 70% Rule + Daily Holding */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-4 ${
                  results.seventyPctPasses
                    ? "bg-emerald-950/40 border-emerald-800/60"
                    : "bg-red-950/40 border-red-800/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      results.seventyPctPasses
                        ? "bg-emerald-500 text-emerald-950"
                        : "bg-red-500 text-red-950"
                    }`}
                  >
                    {results.seventyPctPasses ? "✓" : "✗"}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">70% Rule</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">Max allowable purchase</div>
                <div
                  className={`font-mono text-base font-bold tabular-nums ${
                    results.seventyPctPasses ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {usd(results.maxAllowable)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  (ARV × 70%) − Rehab
                </div>
                {!results.seventyPctPasses && (
                  <div className="text-xs font-medium text-red-300 mt-1.5">
                    {results.maxAllowable > 0
                      ? `Negotiate ${usd(
                          results.costStack.purchasePrice - results.maxAllowable
                        )} off to pass`
                      : "Rehab is too high — no purchase price passes at this ARV"}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs">
                    ◷
                  </span>
                  <span className="text-sm font-semibold text-slate-200">Daily Hold Cost</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  {form.financingType === "hardmoney" ? "Carry + financing per day" : "Carry costs per day"}
                </div>
                <div className="font-mono text-base font-bold tabular-nums text-accent-300">
                  {usd(results.dailyHoldingCost)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {form.financingType === "hardmoney" ? (
                    <>
                      Carry {usdExact(results.dailyCarry)} · Interest {usdExact(results.dailyInterest)}
                      {results.dailyPoints > 0 && <> · Points {usdExact(results.dailyPoints)}</>}
                      {" "}/day × {form.holdingDays} days
                    </>
                  ) : (
                    <>× {form.holdingDays} days</>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 flex flex-col items-center justify-center text-center min-h-64">
            <div className="w-14 h-14 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
              <span className="text-accent-400/60 text-2xl">◈</span>
            </div>
            <p className="text-slate-300 font-medium">Enter deal details to see results</p>
            <p className="text-slate-600 text-sm mt-1">
              Fill in purchase price, ARV, rehab, and holding period
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
