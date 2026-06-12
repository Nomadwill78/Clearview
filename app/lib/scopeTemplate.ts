import type { ScopeItem, Tier } from "./types";

interface TemplateRow {
  tier: Tier;
  category: string;
  description: string;
  unit: string;
  hint: string; // typical cost range shown as a placeholder
}

// Pre-loaded line items for a typical full cosmetic-to-systems flip.
// Hints are typical national ranges; users overwrite with real GC quotes.
const TEMPLATE: TemplateRow[] = [
  // ── Tier 1: Systems ──
  { tier: 1, category: "HVAC", description: "Replace HVAC system (furnace + condenser)", unit: "system", hint: "6,000–12,000" },
  { tier: 1, category: "Roof", description: "Tear-off and replace asphalt shingle roof", unit: "roof", hint: "8,000–15,000" },
  { tier: 1, category: "Foundation", description: "Foundation repair / crack remediation", unit: "job", hint: "2,000–10,000" },
  { tier: 1, category: "Electrical", description: "Upgrade electrical panel to 200A", unit: "panel", hint: "2,000–4,000" },
  { tier: 1, category: "Plumbing", description: "Repipe / major plumbing repairs", unit: "job", hint: "3,000–8,000" },
  { tier: 1, category: "Water / Mold", description: "Water damage & mold remediation", unit: "job", hint: "1,500–6,000" },
  { tier: 1, category: "Water Heater", description: "Replace water heater", unit: "unit", hint: "1,200–2,500" },
  { tier: 1, category: "Windows", description: "Replace windows", unit: "window", hint: "400–800" },

  // ── Tier 2: Wet Rooms ──
  { tier: 2, category: "Kitchen", description: "Cabinets (supply + install)", unit: "kitchen", hint: "5,000–15,000" },
  { tier: 2, category: "Kitchen", description: "Countertops (quartz/granite)", unit: "sq ft", hint: "40–100" },
  { tier: 2, category: "Kitchen", description: "Appliance package (range, fridge, DW, micro)", unit: "set", hint: "2,500–6,000" },
  { tier: 2, category: "Kitchen", description: "Sink, faucet & garbage disposal", unit: "set", hint: "400–1,200" },
  { tier: 2, category: "Kitchen", description: "Backsplash tile", unit: "sq ft", hint: "10–30" },
  { tier: 2, category: "Bathroom", description: "Full bath remodel (tile, tub, surround)", unit: "bath", hint: "5,000–12,000" },
  { tier: 2, category: "Bathroom", description: "Vanity, top & faucet", unit: "vanity", hint: "500–1,500" },
  { tier: 2, category: "Bathroom", description: "Toilet (supply + install)", unit: "toilet", hint: "250–500" },
  { tier: 2, category: "Bathroom", description: "Bath fixtures & accessories", unit: "bath", hint: "200–600" },

  // ── Tier 3: Cosmetic ──
  { tier: 3, category: "Flooring", description: "LVP flooring (supply + install)", unit: "sq ft", hint: "4–8" },
  { tier: 3, category: "Flooring", description: "Carpet bedrooms (supply + install)", unit: "sq ft", hint: "2–5" },
  { tier: 3, category: "Paint", description: "Interior paint (walls, trim, ceilings)", unit: "sq ft", hint: "2–4" },
  { tier: 3, category: "Paint", description: "Exterior paint", unit: "job", hint: "3,000–7,000" },
  { tier: 3, category: "Fixtures", description: "Light fixtures & ceiling fans", unit: "fixture", hint: "75–250" },
  { tier: 3, category: "Hardware", description: "Doors, knobs & hardware package", unit: "house", hint: "800–2,500" },
  { tier: 3, category: "Landscaping", description: "Landscaping & curb appeal", unit: "job", hint: "1,000–5,000" },
  { tier: 3, category: "Staging", description: "Staging (per month)", unit: "month", hint: "1,500–3,000" },
  { tier: 3, category: "Cleaning", description: "Final deep clean & trash-out", unit: "job", hint: "400–1,200" },
];

let counter = 0;
export function newId(): string {
  counter += 1;
  return `si_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultScopeItems(): ScopeItem[] {
  return TEMPLATE.map((row) => ({
    id: newId(),
    tier: row.tier,
    category: row.category,
    description: row.description,
    quantity: "",
    unitCost: "",
    unit: row.unit,
  }));
}

export function templateHint(description: string): string {
  const row = TEMPLATE.find((r) => r.description === description);
  return row ? `$${row.hint}` : "0";
}

export function blankItem(tier: Tier): ScopeItem {
  return {
    id: newId(),
    tier,
    category: "Custom",
    description: "",
    quantity: "1",
    unitCost: "",
    unit: "job",
  };
}
