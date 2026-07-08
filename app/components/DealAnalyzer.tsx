"use client";

import { useMemo } from "react";
import type { DealForm, FinancingType } from "@/app/lib/types";
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

export interface Results {
  costStack: CostStack;
  grossProfit: number;
  roi: number;
  maxAllowable: number;
  seventyPctPasses: boolean;
  dailyHoldingCost: number;
  netAfterTax: number;
  arvPct: number;
  costPct: number;
}

const BUY_CLOSING_PCT = 0.015;
const SELL_CLOSING_PCT = 0.08;
const MONTHLY_CARRY_PCT = 0.005;
const TAX_RATE = 0.32;

export function computeResults(form: DealForm, rehabFromScope: number | null): Results | null {
  const pp = parseFloat(form.purchasePrice);
  const rehab = rehabFromScope !== null ? rehabFromScope : parseFloat(form.rehabBudget);
  const arv = parseFloat(form.arv);
  const days = parseFloat(form.holdingDays);
  const isHM = form.financingType === "hardmoney";

  if ([pp, rehab, arv, days].some((v) => isNaN(v) || v < 0)) return null;
  if (pp <= 0 || arv <= 0 || days <= 0) return null;

  const months = days / 30;
  const buyClose = pp * BUY_CLOSING_PCT;
  const sellClose = arv * SELL_CLOSING_PCT;
  const carry = pp * MONTHLY_CARRY_PCT * months;

  const hmRate = Math.max(0, parseFloat(form.hardMoneyRate) || 0);
  const hmPts = Math.max(0, parseFloat(form.hardMoneyPoints) || 0);
  const hmInterest = isHM ? pp * (hmRate / 100) * (days / 365) : 0;
  const hmPointsCost = isHM ? pp * (hmPts / 100) : 0;

  const total = pp + rehab + buyClose + sellClose + carry + hmInterest + hmPointsCost;
  const grossProfit = arv - total;
  const roi = (grossProfit / total) * 100;
  const maxAllowable = arv * 0.7 - rehab;
  const dailyHoldingCost = (carry + hmInterest + hmPointsCost) / days;
  const netAfterTax = grossProfit > 0 ? grossProfit * (1 - TAX_RATE) : grossProfit;
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
    netAfterTax,
    arvPct,
    costPct,
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

function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

function inputClass(extra = "") {
  return `w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm ${extra}`;
}

function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
      {children}
    </span>
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
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
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
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-800/60 leading-none">
                    FROM SCOPE
                  </span>
                )}
              </div>
              {scopeLinked ? (
                <button
                  onClick={onGoToScope}
                  title="Itemized in the Scope Builder — click to edit"
                  className="w-full bg-slate-800/60 border border-amber-900/50 rounded-lg py-2.5 px-3 text-left text-sm text-amber-300 font-medium tabular-nums hover:border-amber-600 transition"
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
              <button onClick={onGoToScope} className="text-amber-500 hover:text-amber-300 font-medium">
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
                      ? "bg-amber-500 text-slate-900"
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
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
              <p className="text-xs text-amber-600/80 mb-3 uppercase tracking-wider font-medium">
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

        {/* Assumptions note */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Assumptions: </span>
            Buy closing 1.5% · Sell closing 8% of ARV · Carry costs 0.5%/mo of purchase price · Tax rate 32%
          </p>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="space-y-4">
        {results ? (
          <>
            {/* Cost Stack */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
                Cost Stack Breakdown
              </h2>
              <div className="space-y-0.5">
                <CostRow label="Purchase Price" value={results.costStack.purchasePrice} />
                <CostRow
                  label={scopeLinked ? "Rehab Budget (from scope)" : "Rehab Budget"}
                  value={results.costStack.rehabBudget}
                />
                <CostRow label="Buy Closing Costs (1.5%)" value={results.costStack.buyClosingCosts} />
                <CostRow label="Sell Closing Costs (8% ARV)" value={results.costStack.sellClosingCosts} />
                <CostRow
                  label={`Carrying Costs (0.5%/mo × ${parseFloat(form.holdingDays) > 0 ? (parseFloat(form.holdingDays) / 30).toFixed(1) : "0"}mo)`}
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
                <span className="font-bold tabular-nums text-amber-400 text-lg">
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
                      results.grossProfit > 0 ? "bg-amber-500" : "bg-red-500"
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
                  label: "Gross Profit",
                  value: usd(results.grossProfit),
                  positive: results.grossProfit > 0,
                  sub: `ARV − Costs`,
                },
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
                  sub: "32% tax rate",
                },
              ].map(({ label, value, positive, sub }) => (
                <div
                  key={label}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col items-center text-center"
                >
                  <div
                    className={`text-lg sm:text-xl font-bold tabular-nums leading-tight ${
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
                  className={`text-base font-bold tabular-nums ${
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
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                    ◷
                  </span>
                  <span className="text-sm font-semibold text-slate-200">Daily Hold Cost</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">Carry + financing per day</div>
                <div className="text-base font-bold tabular-nums text-amber-300">
                  {usd(results.dailyHoldingCost)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  × {form.holdingDays} days
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-10 flex flex-col items-center justify-center text-center min-h-64">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <span className="text-amber-500/60 text-2xl">◈</span>
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
