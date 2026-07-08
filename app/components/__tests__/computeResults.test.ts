import { describe, it, expect, vi } from "vitest";

// PhotoPicker uses IndexedDB (unavailable in jsdom) — mock the module so
// the DealAnalyzer module can be imported for its pure computeResults export.
vi.mock("@/app/components/PhotoPicker", () => ({
  MainPhotoPicker: () => null,
}));

import { computeResults } from "@/app/components/DealAnalyzer";
import type { DealForm } from "@/app/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: DealForm = {
  address: "123 Flip St",
  purchasePrice: "250000",
  rehabBudget: "45000",
  arv: "380000",
  holdingDays: "90",
  financingType: "cash",
  hardMoneyRate: "12",
  hardMoneyPoints: "2",
};

// Precomputed expected values for BASE cash deal
// months = 3, buyClose = 3750, sellClose = 30400, carry = 3750
// total = 250000+45000+3750+30400+3750 = 332900
const CASH_TOTAL = 332900;
const CASH_PROFIT = 380000 - CASH_TOTAL; // 47100
const CASH_DAILY = 3750 / 90; // 41.666…

// ── Guard: returns null on bad/missing inputs ─────────────────────────────────

describe("computeResults — null guard", () => {
  it("returns null when purchasePrice is empty", () => {
    expect(computeResults({ ...BASE, purchasePrice: "" }, null)).toBeNull();
  });

  it("returns null when arv is empty", () => {
    expect(computeResults({ ...BASE, arv: "" }, null)).toBeNull();
  });

  it("returns null when holdingDays is empty", () => {
    expect(computeResults({ ...BASE, holdingDays: "" }, null)).toBeNull();
  });

  it("returns null when purchasePrice is 0", () => {
    expect(computeResults({ ...BASE, purchasePrice: "0" }, null)).toBeNull();
  });

  it("returns null when arv is 0", () => {
    expect(computeResults({ ...BASE, arv: "0" }, null)).toBeNull();
  });

  it("returns null when holdingDays is 0", () => {
    expect(computeResults({ ...BASE, holdingDays: "0" }, null)).toBeNull();
  });

  it("returns null when purchasePrice is negative", () => {
    expect(computeResults({ ...BASE, purchasePrice: "-1000" }, null)).toBeNull();
  });

  it("returns null when any field is NaN", () => {
    expect(computeResults({ ...BASE, rehabBudget: "abc" }, null)).toBeNull();
  });
});

// ── Cash deal ─────────────────────────────────────────────────────────────────

describe("computeResults — cash deal", () => {
  it("returns a result object for valid inputs", () => {
    expect(computeResults(BASE, null)).not.toBeNull();
  });

  it("calculates buy closing costs at 1.5% of purchase price", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.buyClosingCosts).toBeCloseTo(250000 * 0.015);
  });

  it("calculates sell closing costs at 8% of ARV", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.sellClosingCosts).toBeCloseTo(380000 * 0.08);
  });

  it("calculates carrying costs at 0.5%/month of purchase price", () => {
    const r = computeResults(BASE, null)!;
    const expectedCarry = 250000 * 0.005 * 3; // 3 months
    expect(r.costStack.carryingCosts).toBeCloseTo(expectedCarry);
  });

  it("sets hard money costs to 0 for cash deals", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.hardMoneyInterest).toBe(0);
    expect(r.costStack.hardMoneyPointsCost).toBe(0);
  });

  it("calculates total cost stack correctly", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.total).toBeCloseTo(CASH_TOTAL);
  });

  it("calculates gross profit as ARV minus total costs", () => {
    const r = computeResults(BASE, null)!;
    expect(r.grossProfit).toBeCloseTo(CASH_PROFIT);
  });

  it("calculates ROI as gross profit / total costs × 100", () => {
    const r = computeResults(BASE, null)!;
    expect(r.roi).toBeCloseTo((CASH_PROFIT / CASH_TOTAL) * 100);
  });

  it("calculates net after tax at 68% of gross profit when profitable", () => {
    const r = computeResults(BASE, null)!;
    expect(r.netAfterTax).toBeCloseTo(CASH_PROFIT * 0.68);
  });

  it("calculates daily holding cost from carry costs only (no financing)", () => {
    const r = computeResults(BASE, null)!;
    expect(r.dailyHoldingCost).toBeCloseTo(CASH_DAILY);
  });

  it("cash deal has zero daily interest and points", () => {
    const r = computeResults(BASE, null)!;
    expect(r.dailyCarry).toBeCloseTo(CASH_DAILY);
    expect(r.dailyInterest).toBe(0);
    expect(r.dailyPoints).toBe(0);
  });

  it("costStack.purchasePrice equals the input value", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.purchasePrice).toBe(250000);
  });

  it("costStack.rehabBudget equals the input value (no scope)", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.rehabBudget).toBe(45000);
  });
});

// ── 70% rule ──────────────────────────────────────────────────────────────────

describe("computeResults — 70% rule", () => {
  it("fails when purchase price exceeds (ARV × 70%) − rehab", () => {
    // maxAllowable = 380000 × 0.7 − 45000 = 221000; PP=250000 > 221000
    const r = computeResults(BASE, null)!;
    expect(r.seventyPctPasses).toBe(false);
    expect(r.maxAllowable).toBeCloseTo(221000);
  });

  it("passes when purchase price is at or below the max allowable", () => {
    // maxAllowable = 380000 × 0.7 − 40000 = 226000; PP=200000 ≤ 226000
    const r = computeResults(
      { ...BASE, purchasePrice: "200000", rehabBudget: "40000" },
      null
    )!;
    expect(r.seventyPctPasses).toBe(true);
    expect(r.maxAllowable).toBeCloseTo(226000);
  });

  it("passes when purchase price exactly equals the max allowable", () => {
    const r = computeResults(
      { ...BASE, purchasePrice: "221000", rehabBudget: "45000" },
      null
    )!;
    expect(r.seventyPctPasses).toBe(true);
  });
});

// ── Hard money financing ──────────────────────────────────────────────────────

describe("computeResults — hard money financing", () => {
  const HM: DealForm = { ...BASE, financingType: "hardmoney" };

  it("calculates interest using APR × days / 365", () => {
    const r = computeResults(HM, null)!;
    const expected = 250000 * (12 / 100) * (90 / 365);
    expect(r.costStack.hardMoneyInterest).toBeCloseTo(expected);
  });

  it("calculates points as a % of purchase price", () => {
    const r = computeResults(HM, null)!;
    expect(r.costStack.hardMoneyPointsCost).toBeCloseTo(250000 * 0.02);
  });

  it("includes both interest and points in the total", () => {
    const r = computeResults(HM, null)!;
    const interest = 250000 * (12 / 100) * (90 / 365);
    const points = 250000 * 0.02;
    expect(r.costStack.total).toBeCloseTo(CASH_TOTAL + interest + points);
  });

  it("includes interest and points in daily holding cost", () => {
    const r = computeResults(HM, null)!;
    const carry = 250000 * 0.005 * 3;
    const interest = 250000 * (12 / 100) * (90 / 365);
    const points = 250000 * 0.02;
    expect(r.dailyHoldingCost).toBeCloseTo((carry + interest + points) / 90);
  });

  it("breaks daily holding cost into carry, interest, and points per day", () => {
    const r = computeResults(HM, null)!;
    expect(r.dailyCarry).toBeCloseTo((250000 * 0.005 * 3) / 90);
    expect(r.dailyInterest).toBeCloseTo((250000 * (12 / 100) * (90 / 365)) / 90);
    expect(r.dailyPoints).toBeCloseTo((250000 * 0.02) / 90);
    expect(r.dailyCarry + r.dailyInterest + r.dailyPoints).toBeCloseTo(r.dailyHoldingCost);
  });

  it("hard money deal has lower gross profit than equivalent cash deal", () => {
    const cash = computeResults(BASE, null)!;
    const hm = computeResults(HM, null)!;
    expect(hm.grossProfit).toBeLessThan(cash.grossProfit);
  });

  it("treats 0% rate and 0 points as equivalent to a cash deal cost-wise", () => {
    const r = computeResults(
      { ...HM, hardMoneyRate: "0", hardMoneyPoints: "0" },
      null
    )!;
    expect(r.costStack.hardMoneyInterest).toBe(0);
    expect(r.costStack.hardMoneyPointsCost).toBe(0);
    expect(r.costStack.total).toBeCloseTo(CASH_TOTAL);
  });
});

// ── Loss scenario ─────────────────────────────────────────────────────────────

describe("computeResults — loss scenario", () => {
  const LOSS: DealForm = {
    ...BASE,
    purchasePrice: "350000",
    rehabBudget: "100000",
  };

  it("returns a negative gross profit when costs exceed ARV", () => {
    const r = computeResults(LOSS, null)!;
    expect(r.grossProfit).toBeLessThan(0);
  });

  it("does not apply tax to a loss (netAfterTax equals grossProfit)", () => {
    const r = computeResults(LOSS, null)!;
    expect(r.netAfterTax).toBeCloseTo(r.grossProfit);
  });

  it("returns a negative ROI", () => {
    const r = computeResults(LOSS, null)!;
    expect(r.roi).toBeLessThan(0);
  });
});

// ── Scope-driven rehab ────────────────────────────────────────────────────────

describe("computeResults — rehabFromScope", () => {
  it("uses rehabFromScope instead of form.rehabBudget when non-null", () => {
    const scopeRehab = 60000;
    const r = computeResults(BASE, scopeRehab)!;
    expect(r.costStack.rehabBudget).toBe(scopeRehab);
  });

  it("uses form.rehabBudget when rehabFromScope is null", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costStack.rehabBudget).toBe(45000);
  });

  it("scope rehab of 0 is still treated as a valid override (null check, not falsy)", () => {
    // rehabFromScope = 0 → uses 0, not form.rehabBudget
    const r = computeResults(BASE, 0)!;
    expect(r.costStack.rehabBudget).toBe(0);
  });

  it("produces a higher total when scope rehab exceeds the form value", () => {
    const formResult = computeResults(BASE, null)!;
    const scopeResult = computeResults(BASE, 70000)!;
    expect(scopeResult.costStack.total).toBeGreaterThan(formResult.costStack.total);
  });
});

// ── ARV percentage fields ─────────────────────────────────────────────────────

describe("computeResults — arvPct / costPct", () => {
  it("costPct is total / ARV × 100", () => {
    const r = computeResults(BASE, null)!;
    expect(r.costPct).toBeCloseTo((CASH_TOTAL / 380000) * 100);
  });

  it("arvPct is clamped to [0, 100]", () => {
    // Overpaid deal where total > ARV
    const r = computeResults(
      { ...BASE, purchasePrice: "400000", rehabBudget: "100000" },
      null
    )!;
    expect(r.arvPct).toBe(100);
  });

  it("arvPct matches costPct for a normal profitable deal", () => {
    const r = computeResults(BASE, null)!;
    expect(r.arvPct).toBeCloseTo(r.costPct);
  });
});
