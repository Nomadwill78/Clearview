import { describe, it, expect } from "vitest";
import {
  mortgageMonthly,
  computeRental,
  computeBrrrr,
  computeCommercial,
  dealVerdict,
  HOLD_DEFAULTS,
  REFI_DEFAULTS,
  COMMERCIAL_DEFAULTS,
} from "@/app/lib/analysis";
import type { DealForm } from "@/app/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: DealForm = {
  address: "123 Hold St",
  purchasePrice: "200000",
  rehabBudget: "20000",
  arv: "280000",
  holdingDays: "90",
  financingType: "cash",
  hardMoneyRate: "12",
  hardMoneyPoints: "2",
};

const RENTAL: DealForm = {
  ...BASE,
  strategy: "rental",
  monthlyRent: "2000",
  monthlyTaxes: "200",
  monthlyInsurance: "100",
};

const BRRRR: DealForm = {
  ...BASE,
  strategy: "brrrr",
  monthlyRent: "2000",
  monthlyTaxes: "200",
  monthlyInsurance: "100",
};

const COMMERCIAL: DealForm = {
  ...BASE,
  strategy: "commercial",
  purchasePrice: "1000000",
  rehabBudget: "50000",
  grossAnnualIncome: "150000",
  annualOperatingExpenses: "60000",
};

// ── mortgageMonthly ───────────────────────────────────────────────────────────

describe("mortgageMonthly", () => {
  it("computes a standard 30-year payment", () => {
    // $100k @ 6% / 30yr ≈ $599.55
    expect(mortgageMonthly(100000, 6, 30)).toBeCloseTo(599.55, 1);
  });

  it("handles 0% interest as straight-line principal", () => {
    expect(mortgageMonthly(120000, 0, 10)).toBeCloseTo(1000);
  });

  it("returns 0 for zero principal or term", () => {
    expect(mortgageMonthly(0, 6, 30)).toBe(0);
    expect(mortgageMonthly(100000, 6, 0)).toBe(0);
  });
});

// ── computeRental ─────────────────────────────────────────────────────────────

describe("computeRental — null guard", () => {
  it("returns null without a purchase price", () => {
    expect(computeRental({ ...RENTAL, purchasePrice: "" }, null)).toBeNull();
  });

  it("returns null without monthly rent", () => {
    expect(computeRental({ ...RENTAL, monthlyRent: "" }, null)).toBeNull();
  });

  it("returns null for a zero or negative purchase price", () => {
    expect(computeRental({ ...RENTAL, purchasePrice: "0" }, null)).toBeNull();
    expect(computeRental({ ...RENTAL, purchasePrice: "-5000" }, null)).toBeNull();
  });

  it("treats blank rehab as 0 (turnkey purchase is valid)", () => {
    const r = computeRental({ ...RENTAL, rehabBudget: "" }, null)!;
    expect(r).not.toBeNull();
    expect(r.rehabBudget).toBe(0);
  });
});

describe("computeRental — financed deal (defaults)", () => {
  const r = computeRental(RENTAL, null)!;

  it("computes buy closing at the 1.5% default", () => {
    expect(r.buyClosingCosts).toBeCloseTo(200000 * 0.015);
  });

  it("computes down payment and loan at the 20% default", () => {
    expect(r.downPayment).toBeCloseTo(40000);
    expect(r.loanAmount).toBeCloseTo(160000);
  });

  it("cash invested = down + rehab + closing", () => {
    expect(r.cashInvested).toBeCloseTo(40000 + 20000 + 3000);
  });

  it("computes the mortgage payment on the loan amount", () => {
    expect(r.monthlyPI).toBeCloseTo(
      mortgageMonthly(160000, HOLD_DEFAULTS.loanRatePct, HOLD_DEFAULTS.loanTermYears)
    );
  });

  it("expense lines are % of rent plus flat taxes/insurance", () => {
    expect(r.vacancyLoss).toBeCloseTo(2000 * 0.05);
    expect(r.maintenanceCost).toBeCloseTo(2000 * 0.08);
    expect(r.managementCost).toBeCloseTo(2000 * 0.1);
    expect(r.taxes).toBe(200);
    expect(r.insurance).toBe(100);
  });

  it("NOI = rent − all operating expenses (excludes debt service)", () => {
    const expected = 2000 - 100 - 160 - 200 - 200 - 100;
    expect(r.noiMonthly).toBeCloseTo(expected);
    expect(r.noiAnnual).toBeCloseTo(expected * 12);
  });

  it("cash flow = NOI − mortgage; annual = ×12", () => {
    expect(r.monthlyCashFlow).toBeCloseTo(r.noiMonthly - r.monthlyPI);
    expect(r.annualCashFlow).toBeCloseTo(r.monthlyCashFlow * 12);
  });

  it("cap rate = annual NOI ÷ total project cost", () => {
    expect(r.capRate).toBeCloseTo((r.noiAnnual / (200000 + 20000 + 3000)) * 100);
  });

  it("cash-on-cash = annual cash flow ÷ cash invested", () => {
    expect(r.cashOnCash).toBeCloseTo((r.annualCashFlow / r.cashInvested) * 100);
  });

  it("1% rule compares rent against 1% of purchase + rehab", () => {
    expect(r.onePercentTarget).toBeCloseTo(2200);
    expect(r.onePercentPasses).toBe(false); // 2000 < 2200
  });

  it("1% rule passes when rent clears the target", () => {
    const pass = computeRental({ ...RENTAL, monthlyRent: "2400" }, null)!;
    expect(pass.onePercentPasses).toBe(true);
  });
});

describe("computeRental — cash deal", () => {
  const r = computeRental({ ...RENTAL, holdFinancing: "cash" }, null)!;

  it("has no loan or mortgage payment", () => {
    expect(r.financed).toBe(false);
    expect(r.loanAmount).toBe(0);
    expect(r.monthlyPI).toBe(0);
  });

  it("cash invested equals the full project cost", () => {
    expect(r.cashInvested).toBeCloseTo(200000 + 20000 + 3000);
  });

  it("cash flow equals NOI (no debt service)", () => {
    expect(r.monthlyCashFlow).toBeCloseTo(r.noiMonthly);
  });

  it("cash purchase cash-flows better than the financed version", () => {
    const financed = computeRental(RENTAL, null)!;
    expect(r.monthlyCashFlow).toBeGreaterThan(financed.monthlyCashFlow);
  });
});

describe("computeRental — overrides & scope rehab", () => {
  it("applies custom vacancy/maintenance/management percentages", () => {
    const r = computeRental(
      { ...RENTAL, vacancyPct: "10", maintenancePct: "5", managementPct: "0" },
      null
    )!;
    expect(r.vacancyLoss).toBeCloseTo(200);
    expect(r.maintenanceCost).toBeCloseTo(100);
    expect(r.managementCost).toBe(0);
  });

  it("self-managing (0% management) improves cash flow", () => {
    const managed = computeRental(RENTAL, null)!;
    const self = computeRental({ ...RENTAL, managementPct: "0" }, null)!;
    expect(self.monthlyCashFlow).toBeCloseTo(managed.monthlyCashFlow + 200);
  });

  it("falls back to defaults for blank or invalid overrides", () => {
    const blank = computeRental({ ...RENTAL, vacancyPct: "" }, null)!;
    const junk = computeRental({ ...RENTAL, vacancyPct: "abc" }, null)!;
    for (const r of [blank, junk]) {
      expect(r.assumptions.vacancyPct).toBe(HOLD_DEFAULTS.vacancyPct);
    }
  });

  it("uses rehabFromScope over the form value", () => {
    const r = computeRental(RENTAL, 35000)!;
    expect(r.rehabBudget).toBe(35000);
  });
});

// ── computeBrrrr ──────────────────────────────────────────────────────────────

describe("computeBrrrr — null guard", () => {
  it("requires purchase price, ARV, days, and rent", () => {
    expect(computeBrrrr({ ...BRRRR, purchasePrice: "" }, null)).toBeNull();
    expect(computeBrrrr({ ...BRRRR, arv: "" }, null)).toBeNull();
    expect(computeBrrrr({ ...BRRRR, holdingDays: "0" }, null)).toBeNull();
    expect(computeBrrrr({ ...BRRRR, monthlyRent: "" }, null)).toBeNull();
  });
});

describe("computeBrrrr — cash acquisition (defaults)", () => {
  const r = computeBrrrr(BRRRR, null)!;

  it("all-in total = purchase + rehab + closing + carry", () => {
    const buyClose = 200000 * 0.015;
    const carry = 200000 * 0.005 * 3; // 90 days = 3 months
    expect(r.costStack.total).toBeCloseTo(200000 + 20000 + buyClose + carry);
  });

  it("does not include sell closing costs (the property is kept)", () => {
    // A flip would subtract ~8% of ARV here; BRRRR must not.
    expect(r.costStack.total).toBeLessThan(200000 + 20000 + 5000 + 280000 * 0.08);
  });

  it("refi loan = ARV × 75% default LTV", () => {
    expect(r.refiLoan).toBeCloseTo(280000 * 0.75);
  });

  it("cash back = refi loan − refi closing (1% default)", () => {
    expect(r.refiClosingCosts).toBeCloseTo(210000 * 0.01);
    expect(r.cashBack).toBeCloseTo(210000 - 2100);
  });

  it("cash left in deal = total invested − cash back", () => {
    expect(r.cashLeftInDeal).toBeCloseTo(r.costStack.total - r.cashBack);
  });

  it("equity after refi = ARV − refi loan", () => {
    expect(r.equityAfterRefi).toBeCloseTo(280000 - 210000);
  });

  it("new mortgage uses the refi terms, not the purchase terms", () => {
    expect(r.monthlyPI).toBeCloseTo(
      mortgageMonthly(210000, REFI_DEFAULTS.ratePct, REFI_DEFAULTS.termYears)
    );
  });

  it("cash-on-cash is computed on cash left in deal when positive", () => {
    expect(r.cashLeftInDeal).toBeGreaterThan(0);
    expect(r.cashOnCash).toBeCloseTo((r.annualCashFlow / r.cashLeftInDeal) * 100);
  });
});

describe("computeBrrrr — perfect BRRRR (refi returns all capital)", () => {
  // High ARV relative to all-in cost → refi covers everything
  const r = computeBrrrr({ ...BRRRR, arv: "400000" }, null)!;

  it("cash left in deal is zero or negative", () => {
    expect(r.cashLeftInDeal).toBeLessThanOrEqual(0);
  });

  it("cash-on-cash is null (infinite return)", () => {
    expect(r.cashOnCash).toBeNull();
  });
});

describe("computeBrrrr — refi LTV sensitivity", () => {
  it("a higher LTV leaves less cash in the deal", () => {
    const low = computeBrrrr({ ...BRRRR, refiLtvPct: "70" }, null)!;
    const high = computeBrrrr({ ...BRRRR, refiLtvPct: "80" }, null)!;
    expect(high.cashLeftInDeal).toBeLessThan(low.cashLeftInDeal);
  });

  it("a higher LTV means a bigger loan and lower cash flow", () => {
    const low = computeBrrrr({ ...BRRRR, refiLtvPct: "70" }, null)!;
    const high = computeBrrrr({ ...BRRRR, refiLtvPct: "80" }, null)!;
    expect(high.monthlyPI).toBeGreaterThan(low.monthlyPI);
    expect(high.monthlyCashFlow).toBeLessThan(low.monthlyCashFlow);
  });
});

describe("computeBrrrr — hard money acquisition", () => {
  const r = computeBrrrr({ ...BRRRR, financingType: "hardmoney" }, null)!;

  it("adds hard money interest and points to the all-in cost", () => {
    const interest = 200000 * 0.12 * (90 / 365);
    const points = 200000 * 0.02;
    expect(r.costStack.hardMoneyInterest).toBeCloseTo(interest);
    expect(r.costStack.hardMoneyPointsCost).toBeCloseTo(points);
    const cash = computeBrrrr(BRRRR, null)!;
    expect(r.costStack.total).toBeCloseTo(cash.costStack.total + interest + points);
  });

  it("leaves more cash in the deal than a cash purchase", () => {
    const cash = computeBrrrr(BRRRR, null)!;
    expect(r.cashLeftInDeal).toBeGreaterThan(cash.cashLeftInDeal);
  });
});

// ── computeCommercial ─────────────────────────────────────────────────────────

describe("computeCommercial — null guard", () => {
  it("requires purchase price and gross income", () => {
    expect(computeCommercial({ ...COMMERCIAL, purchasePrice: "" }, null)).toBeNull();
    expect(computeCommercial({ ...COMMERCIAL, grossAnnualIncome: "" }, null)).toBeNull();
  });
});

describe("computeCommercial — with real opex (defaults)", () => {
  const r = computeCommercial(COMMERCIAL, null)!;

  it("EGI = gross − 5% default vacancy", () => {
    expect(r.vacancyLoss).toBeCloseTo(150000 * 0.05);
    expect(r.effectiveGrossIncome).toBeCloseTo(142500);
  });

  it("NOI = EGI − operating expenses, and is not estimated", () => {
    expect(r.opexEstimated).toBe(false);
    expect(r.noi).toBeCloseTo(142500 - 60000);
  });

  it("cap rate = NOI ÷ total project cost", () => {
    const cost = 1000000 + 50000 + 1000000 * 0.015;
    expect(r.totalProjectCost).toBeCloseTo(cost);
    expect(r.capRate).toBeCloseTo((r.noi / cost) * 100);
  });

  it("uses commercial loan defaults (25% down, 25-yr amortization)", () => {
    expect(r.downPayment).toBeCloseTo(250000);
    expect(r.loanAmount).toBeCloseTo(750000);
    expect(r.monthlyPI).toBeCloseTo(
      mortgageMonthly(750000, COMMERCIAL_DEFAULTS.loanRatePct, COMMERCIAL_DEFAULTS.loanTermYears)
    );
  });

  it("DSCR = NOI ÷ annual debt service", () => {
    expect(r.dscr).toBeCloseTo(r.noi / r.annualDebtService);
  });

  it("cash flow and cash-on-cash flow from NOI minus debt service", () => {
    expect(r.annualCashFlow).toBeCloseTo(r.noi - r.annualDebtService);
    expect(r.monthlyCashFlow).toBeCloseTo(r.annualCashFlow / 12);
    expect(r.cashOnCash).toBeCloseTo((r.annualCashFlow / r.cashInvested) * 100);
  });

  it("no market valuation when the market cap rate is blank", () => {
    expect(r.marketCapRatePct).toBeNull();
    expect(r.marketValue).toBeNull();
  });
});

describe("computeCommercial — estimated opex & market value", () => {
  it("falls back to 40% of EGI when opex is blank", () => {
    const r = computeCommercial({ ...COMMERCIAL, annualOperatingExpenses: "" }, null)!;
    expect(r.opexEstimated).toBe(true);
    expect(r.operatingExpenses).toBeCloseTo(142500 * 0.4);
    expect(r.noi).toBeCloseTo(142500 * 0.6);
  });

  it("values the property at NOI ÷ market cap rate when provided", () => {
    const r = computeCommercial({ ...COMMERCIAL, marketCapRatePct: "6.5" }, null)!;
    expect(r.marketValue).toBeCloseTo(r.noi / 0.065);
    expect(r.marketCapRatePct).toBe(6.5);
  });

  it("a lower market cap rate implies a higher value", () => {
    const tight = computeCommercial({ ...COMMERCIAL, marketCapRatePct: "5" }, null)!;
    const loose = computeCommercial({ ...COMMERCIAL, marketCapRatePct: "9" }, null)!;
    expect(tight.marketValue!).toBeGreaterThan(loose.marketValue!);
  });

  it("cash deal has no debt service and no DSCR", () => {
    const r = computeCommercial({ ...COMMERCIAL, holdFinancing: "cash" }, null)!;
    expect(r.dscr).toBeNull();
    expect(r.annualDebtService).toBe(0);
    expect(r.cashInvested).toBeCloseTo(r.totalProjectCost);
    expect(r.annualCashFlow).toBeCloseTo(r.noi);
  });
});

// ── dealVerdict ───────────────────────────────────────────────────────────────

describe("dealVerdict — strategy dispatch", () => {
  it("uses gross profit for flips (default strategy)", () => {
    const v = dealVerdict({ ...BASE, purchasePrice: "100000" }, null)!;
    expect(v.positive).toBe(true);
    expect(v.label).toContain("Profitable");
  });

  it("treats a form with no strategy as a flip", () => {
    const noStrategy = dealVerdict(BASE, null);
    const explicitFlip = dealVerdict({ ...BASE, strategy: "flip" }, null);
    expect(noStrategy).toEqual(explicitFlip);
  });

  it("uses monthly cash flow for rentals", () => {
    const good = dealVerdict({ ...RENTAL, monthlyRent: "3000" }, null)!;
    expect(good.positive).toBe(true);
    expect(good.label).toContain("Cash-flows");
    const bad = dealVerdict({ ...RENTAL, monthlyRent: "500" }, null)!;
    expect(bad.positive).toBe(false);
  });

  it("uses post-refi cash flow for BRRRR", () => {
    expect(dealVerdict(BRRRR, null)).not.toBeNull();
  });

  it("uses annual cash flow for commercial", () => {
    const v = dealVerdict(COMMERCIAL, null)!;
    expect(typeof v.positive).toBe("boolean");
  });

  it("returns null when the strategy's inputs are incomplete", () => {
    expect(dealVerdict({ ...RENTAL, monthlyRent: "" }, null)).toBeNull();
    expect(dealVerdict({ ...COMMERCIAL, grossAnnualIncome: "" }, null)).toBeNull();
    expect(dealVerdict({ ...BRRRR, arv: "" }, null)).toBeNull();
  });
});
