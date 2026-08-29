import type { DealForm } from "./types";
import { parseUserNumber } from "./types";

// Pure deal math for every strategy. UI components render these results;
// nothing in here touches the DOM, so it's all unit-testable.

// ── Shared assumptions ────────────────────────────────────────────────────────

// Effective percents used in the math — echoes overrides or defaults so
// labels always describe the numbers actually applied.
export interface Assumptions {
  buyClosingPct: number;
  sellClosingPct: number;
  monthlyCarryPct: number;
  taxRatePct: number;
}

// National-average defaults, used when a deal doesn't override them.
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  buyClosingPct: 1.5,
  sellClosingPct: 8,
  monthlyCarryPct: 0.5,
  taxRatePct: 32,
};

// Rental & BRRRR operating/financing defaults.
export const HOLD_DEFAULTS = {
  vacancyPct: 5,
  maintenancePct: 8,
  managementPct: 10,
  downPaymentPct: 20,
  loanRatePct: 7,
  loanTermYears: 30,
} as const;

// BRRRR cash-out refinance defaults.
export const REFI_DEFAULTS = {
  ltvPct: 75,
  ratePct: 7,
  termYears: 30,
  closingPct: 1,
} as const;

// Commercial financing & expense defaults. Opex falls back to a percent of
// effective gross income when the user hasn't entered a real number.
export const COMMERCIAL_DEFAULTS = {
  vacancyPct: 5,
  downPaymentPct: 25,
  loanRatePct: 7,
  loanTermYears: 25,
  opexPctOfEgi: 40,
} as const;

// Effective percent for an editable assumption: blank or invalid input falls
// back to the default; values are capped at 100%.
function assumptionPct(raw: string | undefined, fallback: number): number {
  const n = parseUserNumber(raw ?? "");
  return n === null ? fallback : Math.min(n, 100);
}

// Plain numeric field (dollars, years): blank or invalid falls back.
function numOr(raw: string | undefined, fallback: number): number {
  const n = parseUserNumber(raw ?? "");
  return n === null ? fallback : n;
}

// Standard amortized monthly payment (principal & interest).
export function mortgageMonthly(
  principal: number,
  annualRatePct: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

// ── Flip ──────────────────────────────────────────────────────────────────────

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
  // Per-day components of dailyHoldingCost, for the card breakdown
  dailyCarry: number;
  dailyInterest: number;
  dailyPoints: number;
  netAfterTax: number;
  arvPct: number;
  costPct: number;
  assumptions: Assumptions;
  // Minimum ARV at which the deal breaks even (profit = $0)
  breakEvenArv: number;
  // Projected profit divided by holding days — useful for comparing deals
  profitPerDay: number;
}

// Sensitivity analysis: profit & margin at several ARV scenarios around the
// user's base case. Helps investors see how much margin for error they have.
export interface SensitivityPoint {
  pctDelta: number; // -10, -5, 0, +5, +10
  arv: number;
  profit: number;
  margin: number;
  positive: boolean;
}

export function computeFlipSensitivity(
  form: DealForm,
  rehabFromScope: number | null
): SensitivityPoint[] | null {
  const baseArv = parseFloat(form.arv);
  if (isNaN(baseArv) || baseArv <= 0) return null;

  const deltas = [-10, -5, 0, 5, 10];
  return deltas.map((delta) => {
    const adjustedArv = baseArv * (1 + delta / 100);
    const adjustedForm = { ...form, arv: String(adjustedArv) };
    const r = computeResults(adjustedForm, rehabFromScope);
    const profit = r ? r.grossProfit : 0;
    const margin = adjustedArv > 0 ? (profit / adjustedArv) * 100 : 0;
    return {
      pctDelta: delta,
      arv: adjustedArv,
      profit,
      margin,
      positive: profit > 0,
    };
  });
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

  // Break-even ARV: the ARV at which grossProfit = 0.
  // grossProfit = arv - total, but sellClose depends on arv, so:
  // arv = (pp + rehab + buyClose + carry + hmInterest + hmPoints) / (1 - sellClosingPct/100)
  const nonArvCosts = pp + rehab + buyClose + carry + hmInterest + hmPointsCost;
  const breakEvenArv = nonArvCosts / (1 - assumptions.sellClosingPct / 100);

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
    breakEvenArv,
    profitPerDay: grossProfit / days,
  };
}

// ── Rental (buy & hold) ───────────────────────────────────────────────────────

export interface RentalAssumptions {
  buyClosingPct: number;
  vacancyPct: number;
  maintenancePct: number;
  managementPct: number;
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
}

export interface RentalResults {
  purchasePrice: number;
  rehabBudget: number;
  buyClosingCosts: number;
  totalProjectCost: number;
  financed: boolean;
  downPayment: number;
  loanAmount: number;
  monthlyPI: number;
  cashInvested: number;
  grossRent: number;
  vacancyLoss: number;
  maintenanceCost: number;
  managementCost: number;
  taxes: number;
  insurance: number;
  noiMonthly: number;
  noiAnnual: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number; // NOI ÷ total project cost
  cashOnCash: number; // annual cash flow ÷ cash invested
  onePercentTarget: number; // 1% of (purchase + rehab)
  onePercentPasses: boolean;
  assumptions: RentalAssumptions;
}

export function computeRental(form: DealForm, rehabFromScope: number | null): RentalResults | null {
  const pp = parseUserNumber(form.purchasePrice);
  const rent = parseUserNumber(form.monthlyRent ?? "");
  if (pp === null || pp <= 0 || rent === null || rent <= 0) return null;

  // Rehab is optional for a rental — a turnkey purchase is a valid deal.
  const rehab =
    rehabFromScope !== null ? rehabFromScope : parseUserNumber(form.rehabBudget) ?? 0;

  const assumptions: RentalAssumptions = {
    buyClosingPct: assumptionPct(form.buyClosingPct, DEFAULT_ASSUMPTIONS.buyClosingPct),
    vacancyPct: assumptionPct(form.vacancyPct, HOLD_DEFAULTS.vacancyPct),
    maintenancePct: assumptionPct(form.maintenancePct, HOLD_DEFAULTS.maintenancePct),
    managementPct: assumptionPct(form.managementPct, HOLD_DEFAULTS.managementPct),
    downPaymentPct: assumptionPct(form.downPaymentPct, HOLD_DEFAULTS.downPaymentPct),
    loanRatePct: numOr(form.loanRatePct, HOLD_DEFAULTS.loanRatePct),
    loanTermYears: Math.max(1, numOr(form.loanTermYears, HOLD_DEFAULTS.loanTermYears)),
  };

  const financed = (form.holdFinancing ?? "loan") === "loan";
  const buyClosingCosts = pp * (assumptions.buyClosingPct / 100);
  const totalProjectCost = pp + rehab + buyClosingCosts;

  const downPayment = financed ? pp * (assumptions.downPaymentPct / 100) : pp;
  const loanAmount = financed ? pp - downPayment : 0;
  const monthlyPI = financed
    ? mortgageMonthly(loanAmount, assumptions.loanRatePct, assumptions.loanTermYears)
    : 0;
  const cashInvested = downPayment + rehab + buyClosingCosts;

  const vacancyLoss = rent * (assumptions.vacancyPct / 100);
  const maintenanceCost = rent * (assumptions.maintenancePct / 100);
  const managementCost = rent * (assumptions.managementPct / 100);
  const taxes = parseUserNumber(form.monthlyTaxes ?? "") ?? 0;
  const insurance = parseUserNumber(form.monthlyInsurance ?? "") ?? 0;

  const noiMonthly = rent - vacancyLoss - maintenanceCost - managementCost - taxes - insurance;
  const monthlyCashFlow = noiMonthly - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;
  const noiAnnual = noiMonthly * 12;

  const onePercentTarget = (pp + rehab) * 0.01;

  return {
    purchasePrice: pp,
    rehabBudget: rehab,
    buyClosingCosts,
    totalProjectCost,
    financed,
    downPayment,
    loanAmount,
    monthlyPI,
    cashInvested,
    grossRent: rent,
    vacancyLoss,
    maintenanceCost,
    managementCost,
    taxes,
    insurance,
    noiMonthly,
    noiAnnual,
    monthlyCashFlow,
    annualCashFlow,
    capRate: (noiAnnual / totalProjectCost) * 100,
    cashOnCash: cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0,
    onePercentTarget,
    onePercentPasses: rent >= onePercentTarget,
    assumptions,
  };
}

// ── BRRRR (buy, rehab, rent, refinance, repeat) ───────────────────────────────

export interface BrrrrAssumptions extends RentalAssumptions {
  monthlyCarryPct: number;
  refiLtvPct: number;
  refiRatePct: number;
  refiTermYears: number;
  refiClosingPct: number;
}

export interface BrrrrResults {
  // Acquisition & rehab phase (all-in before the refi)
  costStack: {
    purchasePrice: number;
    rehabBudget: number;
    buyClosingCosts: number;
    carryingCosts: number;
    hardMoneyInterest: number;
    hardMoneyPointsCost: number;
    total: number;
  };
  // Refinance
  refiLoan: number; // ARV × LTV
  refiClosingCosts: number;
  cashBack: number; // refi loan − refi closing
  cashLeftInDeal: number; // total invested − cash back (negative = cash-out)
  equityAfterRefi: number; // ARV − refi loan
  monthlyPI: number;
  // Rental phase
  grossRent: number;
  vacancyLoss: number;
  maintenanceCost: number;
  managementCost: number;
  taxes: number;
  insurance: number;
  noiMonthly: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  // null = infinite (all capital returned by the refi)
  cashOnCash: number | null;
  assumptions: BrrrrAssumptions;
}

export function computeBrrrr(form: DealForm, rehabFromScope: number | null): BrrrrResults | null {
  const pp = parseUserNumber(form.purchasePrice);
  const arv = parseUserNumber(form.arv);
  const days = parseUserNumber(form.holdingDays);
  const rent = parseUserNumber(form.monthlyRent ?? "");
  if (pp === null || pp <= 0 || arv === null || arv <= 0) return null;
  if (days === null || days <= 0 || rent === null || rent <= 0) return null;

  const rehab =
    rehabFromScope !== null ? rehabFromScope : parseUserNumber(form.rehabBudget) ?? 0;
  const isHM = form.financingType === "hardmoney";

  const assumptions: BrrrrAssumptions = {
    buyClosingPct: assumptionPct(form.buyClosingPct, DEFAULT_ASSUMPTIONS.buyClosingPct),
    monthlyCarryPct: assumptionPct(form.monthlyCarryPct, DEFAULT_ASSUMPTIONS.monthlyCarryPct),
    vacancyPct: assumptionPct(form.vacancyPct, HOLD_DEFAULTS.vacancyPct),
    maintenancePct: assumptionPct(form.maintenancePct, HOLD_DEFAULTS.maintenancePct),
    managementPct: assumptionPct(form.managementPct, HOLD_DEFAULTS.managementPct),
    downPaymentPct: assumptionPct(form.downPaymentPct, HOLD_DEFAULTS.downPaymentPct),
    loanRatePct: numOr(form.loanRatePct, HOLD_DEFAULTS.loanRatePct),
    loanTermYears: Math.max(1, numOr(form.loanTermYears, HOLD_DEFAULTS.loanTermYears)),
    refiLtvPct: assumptionPct(form.refiLtvPct, REFI_DEFAULTS.ltvPct),
    refiRatePct: numOr(form.refiRatePct, REFI_DEFAULTS.ratePct),
    refiTermYears: Math.max(1, numOr(form.refiTermYears, REFI_DEFAULTS.termYears)),
    refiClosingPct: assumptionPct(form.refiClosingPct, REFI_DEFAULTS.closingPct),
  };

  const months = days / 30;
  const buyClosingCosts = pp * (assumptions.buyClosingPct / 100);
  const carryingCosts = pp * (assumptions.monthlyCarryPct / 100) * months;
  const hmRate = Math.max(0, parseFloat(form.hardMoneyRate) || 0);
  const hmPts = Math.max(0, parseFloat(form.hardMoneyPoints) || 0);
  const hardMoneyInterest = isHM ? pp * (hmRate / 100) * (days / 365) : 0;
  const hardMoneyPointsCost = isHM ? pp * (hmPts / 100) : 0;

  const total =
    pp + rehab + buyClosingCosts + carryingCosts + hardMoneyInterest + hardMoneyPointsCost;

  const refiLoan = arv * (assumptions.refiLtvPct / 100);
  const refiClosingCosts = refiLoan * (assumptions.refiClosingPct / 100);
  const cashBack = refiLoan - refiClosingCosts;
  const cashLeftInDeal = total - cashBack;
  const equityAfterRefi = arv - refiLoan;
  const monthlyPI = mortgageMonthly(refiLoan, assumptions.refiRatePct, assumptions.refiTermYears);

  const vacancyLoss = rent * (assumptions.vacancyPct / 100);
  const maintenanceCost = rent * (assumptions.maintenancePct / 100);
  const managementCost = rent * (assumptions.managementPct / 100);
  const taxes = parseUserNumber(form.monthlyTaxes ?? "") ?? 0;
  const insurance = parseUserNumber(form.monthlyInsurance ?? "") ?? 0;

  const noiMonthly = rent - vacancyLoss - maintenanceCost - managementCost - taxes - insurance;
  const monthlyCashFlow = noiMonthly - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    costStack: {
      purchasePrice: pp,
      rehabBudget: rehab,
      buyClosingCosts,
      carryingCosts,
      hardMoneyInterest,
      hardMoneyPointsCost,
      total,
    },
    refiLoan,
    refiClosingCosts,
    cashBack,
    cashLeftInDeal,
    equityAfterRefi,
    monthlyPI,
    grossRent: rent,
    vacancyLoss,
    maintenanceCost,
    managementCost,
    taxes,
    insurance,
    noiMonthly,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCash: cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : null,
    assumptions,
  };
}

// ── Commercial (income property) ──────────────────────────────────────────────

export interface CommercialAssumptions {
  buyClosingPct: number;
  vacancyPct: number;
  downPaymentPct: number;
  loanRatePct: number;
  loanTermYears: number;
}

export interface CommercialResults {
  purchasePrice: number;
  capexBudget: number;
  buyClosingCosts: number;
  totalProjectCost: number;
  grossAnnualIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  opexEstimated: boolean; // true when opex fell back to the default % of EGI
  noi: number;
  capRate: number; // NOI ÷ total project cost
  marketCapRatePct: number | null;
  marketValue: number | null; // NOI ÷ market cap rate, when provided
  financed: boolean;
  downPayment: number;
  loanAmount: number;
  monthlyPI: number;
  annualDebtService: number;
  dscr: number | null; // NOI ÷ annual debt service (null for cash deals)
  cashInvested: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  cashOnCash: number;
  assumptions: CommercialAssumptions;
}

export function computeCommercial(
  form: DealForm,
  rehabFromScope: number | null
): CommercialResults | null {
  const pp = parseUserNumber(form.purchasePrice);
  const gross = parseUserNumber(form.grossAnnualIncome ?? "");
  if (pp === null || pp <= 0 || gross === null || gross <= 0) return null;

  const capex =
    rehabFromScope !== null ? rehabFromScope : parseUserNumber(form.rehabBudget) ?? 0;

  const assumptions: CommercialAssumptions = {
    buyClosingPct: assumptionPct(form.buyClosingPct, DEFAULT_ASSUMPTIONS.buyClosingPct),
    vacancyPct: assumptionPct(form.vacancyPct, COMMERCIAL_DEFAULTS.vacancyPct),
    downPaymentPct: assumptionPct(form.downPaymentPct, COMMERCIAL_DEFAULTS.downPaymentPct),
    loanRatePct: numOr(form.loanRatePct, COMMERCIAL_DEFAULTS.loanRatePct),
    loanTermYears: Math.max(1, numOr(form.loanTermYears, COMMERCIAL_DEFAULTS.loanTermYears)),
  };

  const vacancyLoss = gross * (assumptions.vacancyPct / 100);
  const effectiveGrossIncome = gross - vacancyLoss;
  const opexRaw = parseUserNumber(form.annualOperatingExpenses ?? "");
  const opexEstimated = opexRaw === null;
  const operatingExpenses =
    opexRaw ?? effectiveGrossIncome * (COMMERCIAL_DEFAULTS.opexPctOfEgi / 100);
  const noi = effectiveGrossIncome - operatingExpenses;

  const buyClosingCosts = pp * (assumptions.buyClosingPct / 100);
  const totalProjectCost = pp + capex + buyClosingCosts;

  const marketCapRatePct = parseUserNumber(form.marketCapRatePct ?? "");
  const marketValue =
    marketCapRatePct !== null && marketCapRatePct > 0 ? noi / (marketCapRatePct / 100) : null;

  const financed = (form.holdFinancing ?? "loan") === "loan";
  const downPayment = financed ? pp * (assumptions.downPaymentPct / 100) : pp;
  const loanAmount = financed ? pp - downPayment : 0;
  const monthlyPI = financed
    ? mortgageMonthly(loanAmount, assumptions.loanRatePct, assumptions.loanTermYears)
    : 0;
  const annualDebtService = monthlyPI * 12;
  const cashInvested = downPayment + capex + buyClosingCosts;
  const annualCashFlow = noi - annualDebtService;

  return {
    purchasePrice: pp,
    capexBudget: capex,
    buyClosingCosts,
    totalProjectCost,
    grossAnnualIncome: gross,
    vacancyLoss,
    effectiveGrossIncome,
    operatingExpenses,
    opexEstimated,
    noi,
    capRate: (noi / totalProjectCost) * 100,
    marketCapRatePct: marketCapRatePct !== null && marketCapRatePct > 0 ? marketCapRatePct : null,
    marketValue,
    financed,
    downPayment,
    loanAmount,
    monthlyPI,
    annualDebtService,
    dscr: financed && annualDebtService > 0 ? noi / annualDebtService : null,
    cashInvested,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    cashOnCash: cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0,
    assumptions,
  };
}

// ── Header verdict ────────────────────────────────────────────────────────────

// One-line health badge for the app header, whatever the strategy.
export function dealVerdict(
  form: DealForm,
  rehabFromScope: number | null
): { positive: boolean; label: string } | null {
  const strategy = form.strategy ?? "flip";
  if (strategy === "rental") {
    const r = computeRental(form, rehabFromScope);
    if (!r) return null;
    const positive = r.monthlyCashFlow > 0;
    return { positive, label: positive ? "▲ Cash-flows" : "▼ Negative" };
  }
  if (strategy === "brrrr") {
    const r = computeBrrrr(form, rehabFromScope);
    if (!r) return null;
    const positive = r.monthlyCashFlow > 0;
    return { positive, label: positive ? "▲ Cash-flows" : "▼ Negative" };
  }
  if (strategy === "commercial") {
    const r = computeCommercial(form, rehabFromScope);
    if (!r) return null;
    const positive = r.annualCashFlow > 0;
    return { positive, label: positive ? "▲ Cash-flows" : "▼ Negative" };
  }
  const r = computeResults(form, rehabFromScope);
  if (!r) return null;
  const positive = r.grossProfit > 0;
  return { positive, label: positive ? "▲ Profitable" : "▼ Loss" };
}
