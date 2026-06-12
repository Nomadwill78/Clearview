export type FinancingType = "cash" | "hardmoney";

export interface DealForm {
  address: string;
  purchasePrice: string;
  rehabBudget: string;
  arv: string;
  holdingDays: string;
  financingType: FinancingType;
  hardMoneyRate: string;
  hardMoneyPoints: string;
}

export type Tier = 1 | 2 | 3;

export interface ScopeItem {
  id: string;
  tier: Tier;
  category: string;
  description: string;
  quantity: string;
  unitCost: string;
  unit: string;
  photoId?: string | null;
}

export interface Deal {
  id: string;
  createdAt: number;
  updatedAt: number;
  form: DealForm;
  scopeItems: ScopeItem[];
  contingencyEnabled: boolean;
  mainPhotoId?: string | null;
}

export const TIER_INFO: Record<Tier, { name: string; subtitle: string }> = {
  1: { name: "Systems", subtitle: "Non-negotiables — inspect and budget these first" },
  2: { name: "Wet Rooms", subtitle: "Kitchen & bathrooms — where the value is won" },
  3: { name: "Cosmetic", subtitle: "Finishes, paint, and curb appeal" },
};

export const CONTINGENCY_PCT = 0.15;

export function itemTotal(item: ScopeItem): number {
  const qty = parseFloat(item.quantity);
  const cost = parseFloat(item.unitCost);
  if (isNaN(qty) || isNaN(cost) || qty < 0 || cost < 0) return 0;
  return qty * cost;
}

export function scopeSubtotal(items: ScopeItem[]): number {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

export function scopeTotal(items: ScopeItem[], contingencyEnabled: boolean): number {
  const subtotal = scopeSubtotal(items);
  return contingencyEnabled ? subtotal * (1 + CONTINGENCY_PCT) : subtotal;
}

export function tierSubtotal(items: ScopeItem[], tier: Tier): number {
  return scopeSubtotal(items.filter((i) => i.tier === tier));
}
