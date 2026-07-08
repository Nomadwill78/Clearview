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

// Areas of a home, in the order a flipper typically walks/scopes a property.
export type SectionKey =
  | "systems"
  | "exterior"
  | "kitchen"
  | "bathrooms"
  | "bedrooms"
  | "living"
  | "laundry"
  | "garage"
  | "basement"
  | "landscape"
  | "pool"
  | "general";

export interface ScopeItem {
  id: string;
  tier: Tier;
  section?: SectionKey; // optional for back-compat with older saved deals
  roomId?: string; // when set, the item belongs to a user-added room, not a fixed area
  category: string;
  description: string;
  quantity: string;
  unitCost: string;
  unit: string;
  photoId?: string | null;
}

// User-added rooms (e.g., "Bedroom 2", "Hall Bath") live alongside the fixed areas.
export type RoomType =
  | "bedroom"
  | "bathroom"
  | "halfbath"
  | "kitchen"
  | "living"
  | "dining"
  | "office"
  | "bonus"
  | "sunroom"
  | "mudroom"
  | "custom";

export interface CustomRoom {
  id: string;
  name: string;
  type: RoomType;
  tier: Tier;
}

export interface Deal {
  id: string;
  createdAt: number;
  updatedAt: number;
  form: DealForm;
  scopeItems: ScopeItem[];
  contingencyEnabled: boolean;
  mainPhotoId?: string | null;
  rooms?: CustomRoom[];
}

export const TIER_INFO: Record<Tier, { name: string; subtitle: string }> = {
  1: { name: "Systems", subtitle: "Non-negotiables — inspect and budget these first" },
  2: { name: "Wet Rooms", subtitle: "Kitchen & bathrooms — where the value is won" },
  3: { name: "Cosmetic", subtitle: "Finishes, paint, and curb appeal" },
};

export interface SectionMeta {
  key: SectionKey;
  name: string;
  subtitle: string;
  tier: Tier; // drives the priority color badge
}

// Ordered: critical systems & envelope first, then value rooms, then the rest.
export const SECTIONS: SectionMeta[] = [
  { key: "systems", name: "Systems & Mechanical", subtitle: "HVAC, roof, electrical, plumbing — inspect and budget first", tier: 1 },
  { key: "exterior", name: "Exterior & Structure", subtitle: "Siding, gutters, doors, deck, driveway, fencing", tier: 1 },
  { key: "kitchen", name: "Kitchen", subtitle: "Where resale value is won", tier: 2 },
  { key: "bathrooms", name: "Bathrooms", subtitle: "Per bathroom — use Qty for multiples", tier: 2 },
  { key: "bedrooms", name: "Bedrooms", subtitle: "Flooring, paint, closets, doors", tier: 3 },
  { key: "living", name: "Living & Common Areas", subtitle: "Living, dining, hallways, stairs, entry", tier: 3 },
  { key: "laundry", name: "Laundry & Utility", subtitle: "Hookups, flooring, utility sink", tier: 3 },
  { key: "garage", name: "Garage", subtitle: "Door, opener, floor, drywall", tier: 3 },
  { key: "basement", name: "Basement & Attic", subtitle: "Waterproofing, insulation, finishing, egress", tier: 1 },
  { key: "landscape", name: "Landscaping & Site", subtitle: "Sod, plants, grading, drainage, walkways", tier: 3 },
  { key: "pool", name: "Pool & Outbuildings", subtitle: "Pool, shed, detached structures", tier: 3 },
  { key: "general", name: "General Conditions", subtitle: "Permits, debris, final clean, staging", tier: 3 },
];

export const SECTION_META: Record<SectionKey, SectionMeta> = SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<SectionKey, SectionMeta>
);

// Resolve an item's section, inferring one for older deals saved before
// sections existed (so no line item ever disappears from the UI/PDF).
export function itemSection(item: ScopeItem): SectionKey {
  if (item.section && SECTION_META[item.section]) return item.section;
  const c = (item.category || "").toLowerCase();
  if (/hvac|roof|foundation|electric|plumb|water|mold|sewer|septic|window/.test(c)) return "systems";
  if (/kitchen/.test(c)) return "kitchen";
  if (/bath/.test(c)) return "bathrooms";
  if (/bedroom/.test(c)) return "bedrooms";
  if (/garage/.test(c)) return "garage";
  if (/landscap|yard|site|grad|drain/.test(c)) return "landscape";
  if (/pool|shed|outbuilding/.test(c)) return "pool";
  if (/stag|clean|permit|debris|dumpster|general/.test(c)) return "general";
  if (/siding|gutter|exterior|deck|porch|driveway|fence|fascia|soffit/.test(c)) return "exterior";
  if (/basement|attic|insulation/.test(c)) return "basement";
  // fall back by tier
  return item.tier === 1 ? "systems" : item.tier === 2 ? "kitchen" : "living";
}

export const CONTINGENCY_PCT = 0.15;

// Parse a user-entered quantity or unit cost. Accepts plain numbers plus
// common money formatting ("$8,500", "1,200.50", " 15 "). Returns null when
// the text is empty or not a single non-negative number, so callers can tell
// "not entered / invalid" apart from a real 0. Every place that turns a
// ScopeItem string into math must go through this so the field, the row
// total, and the PDF always agree.
export function parseUserNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$,]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function itemTotal(item: ScopeItem): number {
  const qty = parseUserNumber(item.quantity);
  const cost = parseUserNumber(item.unitCost);
  if (qty === null || cost === null) return 0;
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

export function sectionSubtotal(items: ScopeItem[], key: SectionKey): number {
  // Fixed-area subtotals exclude items that belong to a user-added room.
  return scopeSubtotal(items.filter((i) => !i.roomId && itemSection(i) === key));
}

export function roomSubtotal(items: ScopeItem[], roomId: string): number {
  return scopeSubtotal(items.filter((i) => i.roomId === roomId));
}
