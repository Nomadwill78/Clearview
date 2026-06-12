"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Deal, ScopeItem } from "@/app/lib/types";
import { scopeTotal } from "@/app/lib/types";
import { loadDeals, saveDeals, newDeal, dealLabel } from "@/app/lib/storage";
import { deletePhoto } from "@/app/lib/photos";
import DealAnalyzer, { computeResults } from "@/app/components/DealAnalyzer";
import ScopeBuilder from "@/app/components/ScopeBuilder";

type Tab = "analyzer" | "scope";

export default function FlipOSApp() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("analyzer");
  const [exporting, setExporting] = useState(false);
  const loaded = useRef(false);

  // Load saved deals once on mount (client only — avoids hydration mismatch)
  useEffect(() => {
    const saved = loadDeals();
    if (saved.length > 0) {
      setDeals(saved);
      setActiveId(saved[0].id);
    } else {
      const d = newDeal();
      setDeals([d]);
      setActiveId(d.id);
    }
    loaded.current = true;
  }, []);

  // Persist on every change after initial load
  useEffect(() => {
    if (loaded.current && deals) saveDeals(deals);
  }, [deals]);

  const activeDeal = useMemo(
    () => deals?.find((d) => d.id === activeId) ?? null,
    [deals, activeId]
  );

  function updateActiveDeal(patch: Partial<Deal>) {
    setDeals((prev) =>
      prev
        ? prev.map((d) =>
            d.id === activeId ? { ...d, ...patch, updatedAt: Date.now() } : d
          )
        : prev
    );
  }

  function handleNewDeal() {
    const d = newDeal();
    setDeals((prev) => (prev ? [d, ...prev] : [d]));
    setActiveId(d.id);
    setTab("analyzer");
  }

  function handleDeleteDeal() {
    if (!deals || !activeDeal) return;
    if (!window.confirm(`Delete "${dealLabel(activeDeal)}"? This can't be undone.`)) return;
    // best-effort cleanup of this deal's photos
    void deletePhoto(activeDeal.mainPhotoId);
    activeDeal.scopeItems.forEach((it) => void deletePhoto(it.photoId));
    const remaining = deals.filter((d) => d.id !== activeId);
    if (remaining.length === 0) {
      const d = newDeal();
      setDeals([d]);
      setActiveId(d.id);
    } else {
      setDeals(remaining);
      setActiveId(remaining[0].id);
    }
  }

  async function handleExportPdf() {
    if (!activeDeal || exporting) return;
    setExporting(true);
    try {
      // PDF library loads only when needed — keeps the app fast
      const { downloadScopePdf } = await import("@/app/components/scopePdf");
      await downloadScopePdf(activeDeal);
    } catch (err) {
      console.error("PDF export failed", err);
      window.alert("Sorry — the PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  // Scope total drives the rehab budget when the scope has real numbers in it
  const scopeRehab = activeDeal
    ? scopeTotal(activeDeal.scopeItems, activeDeal.contingencyEnabled)
    : 0;
  const rehabFromScope = scopeRehab > 0 ? scopeRehab : null;

  const results = activeDeal ? computeResults(activeDeal.form, rehabFromScope) : null;

  if (!deals || !activeDeal) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="text-slate-600 text-sm">Loading your deals…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center font-bold text-slate-900 text-xs select-none">
              FO
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-amber-400">Flip</span>
              <span className="text-slate-100">OS</span>
            </span>
          </div>

          {/* Deal switcher */}
          <div className="flex items-center gap-2 min-w-0">
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="max-w-40 sm:max-w-60 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 truncate"
              title="Switch deal"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {dealLabel(d)}
                </option>
              ))}
            </select>
            <button
              onClick={handleNewDeal}
              className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              title="Start a new deal"
            >
              + New
            </button>
            <button
              onClick={handleDeleteDeal}
              className="shrink-0 text-slate-500 hover:text-red-400 text-sm px-1.5 py-1.5 transition-colors"
              title="Delete this deal"
            >
              🗑
            </button>
          </div>

          {results && (
            <div
              className={`hidden md:block text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                results.grossProfit > 0
                  ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800"
                  : "bg-red-900/60 text-red-400 border border-red-800"
              }`}
            >
              {results.grossProfit > 0 ? "▲ Profitable" : "▼ Loss"}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1">
          {(
            [
              ["analyzer", "Deal Analyzer"],
              ["scope", "Scope Builder"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          {tab === "scope" && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="my-1 px-3 text-xs font-semibold rounded-lg border border-amber-700/60 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
            >
              {exporting ? "Building PDF…" : "⤓ Export PDF for GCs"}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {tab === "analyzer" ? (
          <DealAnalyzer
            form={activeDeal.form}
            onFormChange={(form) => updateActiveDeal({ form })}
            rehabFromScope={rehabFromScope}
            onGoToScope={() => setTab("scope")}
            mainPhotoId={activeDeal.mainPhotoId}
            onMainPhotoChange={(mainPhotoId) => updateActiveDeal({ mainPhotoId })}
          />
        ) : (
          <ScopeBuilder
            items={activeDeal.scopeItems}
            contingencyEnabled={activeDeal.contingencyEnabled}
            onItemsChange={(scopeItems: ScopeItem[]) => updateActiveDeal({ scopeItems })}
            onContingencyChange={(contingencyEnabled) =>
              updateActiveDeal({ contingencyEnabled })
            }
          />
        )}
      </main>
    </div>
  );
}
