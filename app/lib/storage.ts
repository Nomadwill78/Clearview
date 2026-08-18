import type { Deal, DealForm } from "./types";
import { defaultScopeItems, newId } from "./scopeTemplate";

const STORAGE_KEY = "flipos.deals.v1";

export function emptyForm(): DealForm {
  return {
    address: "",
    purchasePrice: "",
    rehabBudget: "",
    arv: "",
    holdingDays: "",
    financingType: "cash",
    hardMoneyRate: "12",
    hardMoneyPoints: "2",
    strategy: "flip",
    holdFinancing: "loan",
  };
}

export function newDeal(): Deal {
  const now = Date.now();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    form: emptyForm(),
    scopeItems: defaultScopeItems(),
    contingencyEnabled: true,
  };
}

export function loadDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is Deal =>
        d && typeof d.id === "string" && d.form && Array.isArray(d.scopeItems)
    );
  } catch {
    return [];
  }
}

export function saveDeals(deals: Deal[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch {
    // storage full or blocked — fail silently, app still works in memory
  }
}

// Strategy tags in the deal switcher. Flips are the default, so they stay
// untagged and existing deals read exactly as they did before.
const STRATEGY_TAGS: Record<string, string> = {
  rental: "Rental",
  brrrr: "BRRRR",
  commercial: "Commercial",
};

export function dealLabel(deal: Deal): string {
  const base = deal.form.address.trim() || "Untitled deal";
  const tag = deal.form.strategy ? STRATEGY_TAGS[deal.form.strategy] : undefined;
  return tag ? `${base} · ${tag}` : base;
}
