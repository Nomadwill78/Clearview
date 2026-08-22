"use client";

import { useState } from "react";
import { PRICING, FREE_DEAL_LIMIT } from "@/app/lib/plan";

type Interval = "monthly" | "annual";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  /** Why the modal opened — tailors the headline */
  reason?: "deals" | "pdf" | null;
}

const FREE_FEATURES = [
  `${FREE_DEAL_LIMIT} active deal`,
  "Full Deal Analyzer (ROI, 70% rule, cost stack)",
  "Scope Builder with all three tiers",
  "Property & scope item photos",
];

const PRO_FEATURES = [
  "Unlimited deals",
  "PDF scope-of-work export for contractors",
  "Photos embedded in PDF bids",
  "Cloud sync across devices (coming soon)",
  "Priority support",
];

export default function PricingModal({ open, onClose, reason }: PricingModalProps) {
  const [interval, setInterval] = useState<Interval>("annual");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const headline =
    reason === "deals"
      ? "You've hit the free plan's deal limit"
      : reason === "pdf"
      ? "PDF export is a Pro feature"
      : "Upgrade to FlipOS Pro";

  async function handleUpgrade() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(
        data.error ||
          "Payments are being set up — check back very soon. Nothing was charged."
      );
    } catch {
      setNotice("Couldn't reach the payment server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const monthlyEquiv = (PRICING.annual / 12).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-slate-100">{headline}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-lg leading-none px-1"
            title="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Go Pro to run unlimited deals and hand polished scope-of-work PDFs to your contractors.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
            <h3 className="font-semibold text-slate-200">Free</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-slate-100">$0</span>
              <span className="text-slate-500 text-sm"> forever</span>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-400">
                  <span className="text-slate-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-xl border border-amber-700/70 bg-amber-950/15 p-5">
            <span className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 uppercase tracking-wider">
              Best for working flippers
            </span>
            <h3 className="font-semibold text-amber-400 mb-3">FlipOS Pro</h3>

            {/* Both billing options always visible and selectable */}
            <div className="space-y-2 mb-4">
              {/* Monthly */}
              <button
                onClick={() => setInterval("monthly")}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  interval === "monthly"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      interval === "monthly" ? "border-amber-500" : "border-slate-600"
                    }`}
                  >
                    {interval === "monthly" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-200">Monthly</span>
                </span>
                <span className="text-slate-100">
                  <span className="text-xl font-bold">${PRICING.monthly}</span>
                  <span className="text-slate-500 text-xs"> /mo</span>
                </span>
              </button>

              {/* Annual */}
              <button
                onClick={() => setInterval("annual")}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  interval === "annual"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      interval === "annual" ? "border-amber-500" : "border-slate-600"
                    }`}
                  >
                    {interval === "annual" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-slate-200">Annual</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-400 uppercase tracking-wide">
                    2 months free
                  </span>
                </span>
                <span className="text-slate-100 text-right">
                  <span className="text-xl font-bold">${PRICING.annual}</span>
                  <span className="text-slate-500 text-xs"> /yr</span>
                  <span className="block text-[10px] text-emerald-400">
                    ≈ ${monthlyEquiv}/mo
                  </span>
                </span>
              </button>
            </div>

            <ul className="space-y-2 mb-5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-amber-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold text-sm transition-colors"
            >
              {loading
                ? "Opening secure checkout…"
                : interval === "monthly"
                ? `Upgrade — $${PRICING.monthly}/mo`
                : `Upgrade — $${PRICING.annual}/yr`}
            </button>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Secure payment by Stripe · Cancel anytime
            </p>
          </div>
        </div>

        {notice && (
          <p className="mt-4 text-sm text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}

        <p className="text-xs text-slate-500 mt-4 text-center">
          One flip pays for years of Pro. A single bad rehab estimate costs more than a decade of it.
        </p>
      </div>
    </div>
  );
}
