"use client";

import { useState } from "react";
import type { ScopeItem, Tier } from "@/app/lib/types";
import {
  TIER_INFO,
  CONTINGENCY_PCT,
  itemTotal,
  scopeSubtotal,
  scopeTotal,
  tierSubtotal,
} from "@/app/lib/types";
import { blankItem, templateHint } from "@/app/lib/scopeTemplate";

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function inputClass(extra = "") {
  return `w-full bg-slate-800 border border-slate-700 rounded-lg py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm ${extra}`;
}

const TIER_ORDER: Tier[] = [1, 2, 3];

const TIER_BADGE: Record<Tier, string> = {
  1: "bg-red-500/15 text-red-400 border-red-800/60",
  2: "bg-sky-500/15 text-sky-400 border-sky-800/60",
  3: "bg-emerald-500/15 text-emerald-400 border-emerald-800/60",
};

interface ScopeBuilderProps {
  items: ScopeItem[];
  contingencyEnabled: boolean;
  onItemsChange: (items: ScopeItem[]) => void;
  onContingencyChange: (enabled: boolean) => void;
}

export default function ScopeBuilder({
  items,
  contingencyEnabled,
  onItemsChange,
  onContingencyChange,
}: ScopeBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<Tier, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  function toggleTier(tier: Tier) {
    setCollapsed((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }

  function updateItem(id: string, patch: Partial<ScopeItem>) {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((it) => it.id !== id));
  }

  function addItem(tier: Tier) {
    onItemsChange([...items, blankItem(tier)]);
    setCollapsed((prev) => ({ ...prev, [tier]: false }));
  }

  const subtotal = scopeSubtotal(items);
  const contingencyAmount = contingencyEnabled ? subtotal * CONTINGENCY_PCT : 0;
  const grandTotal = scopeTotal(items, contingencyEnabled);

  return (
    <div className="space-y-4">
      {TIER_ORDER.map((tier) => {
        const tierItems = items.filter((it) => it.tier === tier);
        const tSubtotal = tierSubtotal(items, tier);
        const isCollapsed = collapsed[tier];
        const filledCount = tierItems.filter((it) => itemTotal(it) > 0).length;

        return (
          <section
            key={tier}
            className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
          >
            {/* Tier header */}
            <button
              onClick={() => toggleTier(tier)}
              className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-800/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${TIER_BADGE[tier]}`}
                >
                  Tier {tier}
                </span>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100">
                    {TIER_INFO[tier].name}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">
                    {TIER_INFO[tier].subtitle}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {filledCount > 0 && (
                  <span className="hidden sm:block text-xs text-slate-500">
                    {filledCount} item{filledCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className="font-bold tabular-nums text-amber-400 text-sm">
                  {usd(tSubtotal)}
                </span>
                <span className="text-slate-500 text-xs select-none">
                  {isCollapsed ? "▸" : "▾"}
                </span>
              </div>
            </button>

            {/* Line items */}
            {!isCollapsed && (
              <div className="border-t border-slate-800">
                {/* Column labels (desktop) */}
                <div className="hidden sm:grid grid-cols-[1fr_5rem_6.5rem_6rem_2rem] gap-2 px-5 pt-3 pb-1 text-xs text-slate-600 uppercase tracking-wider font-medium">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Unit Cost</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <div className="px-4 sm:px-5 pb-4 space-y-2">
                  {tierItems.map((item) => {
                    const total = itemTotal(item);
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 sm:grid-cols-[1fr_5rem_6.5rem_6rem_2rem] gap-2 items-center bg-slate-950/40 sm:bg-transparent rounded-lg sm:rounded-none p-2.5 sm:p-0"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Describe the work…"
                          className={inputClass("px-3 col-span-2 sm:col-span-1")}
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                          placeholder="0"
                          min="0"
                          className={inputClass("pl-3 pr-2")}
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.id, { unitCost: e.target.value })}
                            placeholder={templateHint(item.description).replace("$", "")}
                            min="0"
                            className={inputClass("pl-6 pr-2")}
                          />
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-medium tabular-nums text-sm ${
                              total > 0 ? "text-slate-100" : "text-slate-600"
                            }`}
                          >
                            {usd(total)}
                          </span>
                          <span className="block text-[10px] text-slate-600 leading-none">
                            {item.unit !== "job" || total > 0 ? `per ${item.unit}` : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                          className="justify-self-end sm:justify-self-center text-slate-600 hover:text-red-400 transition-colors text-sm px-1"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => addItem(tier)}
                    className="mt-1 text-xs font-medium text-amber-500 hover:text-amber-300 transition-colors"
                  >
                    + Add line item
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Totals */}
      <section className="bg-slate-900 rounded-xl border border-amber-900/50 p-5">
        <div className="flex justify-between items-center py-1.5">
          <span className="text-sm text-slate-400">Scope Subtotal</span>
          <span className="font-medium tabular-nums text-slate-200">{usd(subtotal)}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800 pb-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              role="switch"
              aria-checked={contingencyEnabled}
              onClick={() => onContingencyChange(!contingencyEnabled)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                contingencyEnabled ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  contingencyEnabled ? "translate-x-[1.125rem]" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-slate-400">
              Contingency <span className="text-slate-500">(+15% — recommended for older builds)</span>
            </span>
          </label>
          <span className="font-medium tabular-nums text-slate-200">
            {usd(contingencyAmount)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-3">
          <span className="font-semibold text-slate-100">Total Rehab Budget</span>
          <span className="font-bold tabular-nums text-amber-400 text-xl">
            {usd(grandTotal)}
          </span>
        </div>
        {grandTotal > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            This total feeds the Deal Analyzer automatically — switch tabs to see the deal update.
          </p>
        )}
      </section>
    </div>
  );
}
