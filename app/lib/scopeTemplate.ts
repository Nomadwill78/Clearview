import type { ScopeItem, SectionKey, RoomType, CustomRoom, Tier } from "./types";
import { SECTION_META } from "./types";

interface TemplateRow {
  section: SectionKey;
  category: string;
  description: string;
  unit: string;
  hint: string; // typical cost range shown as a placeholder
}

// Exhaustive default line items spanning a full property walkthrough.
// Users price what applies and ignore the rest; only priced items feed the
// budget and appear on the contractor PDF. Hints are typical US ranges —
// real GC quotes overwrite them.
const TEMPLATE: TemplateRow[] = [
  // ── Systems & Mechanical ──
  { section: "systems", category: "HVAC", description: "Replace HVAC system (furnace + condenser)", unit: "system", hint: "6,000–12,000" },
  { section: "systems", category: "HVAC", description: "Service / repair existing HVAC", unit: "job", hint: "300–1,500" },
  { section: "systems", category: "HVAC", description: "Ductwork repair / replacement", unit: "job", hint: "1,500–6,000" },
  { section: "systems", category: "Roof", description: "Tear-off & replace asphalt shingle roof", unit: "roof", hint: "8,000–15,000" },
  { section: "systems", category: "Roof", description: "Roof repair / partial patch", unit: "job", hint: "500–3,000" },
  { section: "systems", category: "Foundation", description: "Foundation repair / crack remediation", unit: "job", hint: "2,000–10,000" },
  { section: "systems", category: "Electrical", description: "Upgrade electrical panel to 200A", unit: "panel", hint: "2,000–4,000" },
  { section: "systems", category: "Electrical", description: "Rewire / update outlets, switches, GFCIs", unit: "job", hint: "1,500–8,000" },
  { section: "systems", category: "Plumbing", description: "Repipe / major plumbing repairs", unit: "job", hint: "3,000–8,000" },
  { section: "systems", category: "Plumbing", description: "Sewer line / septic repair", unit: "job", hint: "2,000–10,000" },
  { section: "systems", category: "Water Heater", description: "Replace water heater", unit: "unit", hint: "1,200–2,500" },
  { section: "systems", category: "Water / Mold", description: "Water damage & mold remediation", unit: "job", hint: "1,500–6,000" },
  { section: "systems", category: "Windows", description: "Replace windows", unit: "window", hint: "400–800" },

  // ── Exterior & Structure ──
  { section: "exterior", category: "Siding", description: "Siding repair / replacement", unit: "sq ft", hint: "4–12" },
  { section: "exterior", category: "Paint", description: "Exterior paint (whole house)", unit: "job", hint: "3,000–7,000" },
  { section: "exterior", category: "Gutters", description: "Gutters & downspouts", unit: "linear ft", hint: "6–12" },
  { section: "exterior", category: "Soffit/Fascia", description: "Soffit & fascia repair", unit: "linear ft", hint: "6–20" },
  { section: "exterior", category: "Doors", description: "Exterior / entry doors", unit: "door", hint: "400–1,500" },
  { section: "exterior", category: "Deck/Porch", description: "Deck or porch repair / rebuild", unit: "job", hint: "1,500–8,000" },
  { section: "exterior", category: "Driveway", description: "Driveway repair / repour", unit: "job", hint: "2,000–8,000" },
  { section: "exterior", category: "Fencing", description: "Fencing (supply + install)", unit: "linear ft", hint: "20–45" },
  { section: "exterior", category: "Exterior", description: "Pressure wash & exterior cleanup", unit: "job", hint: "300–800" },

  // ── Kitchen ──
  { section: "kitchen", category: "Kitchen", description: "Cabinets (supply + install)", unit: "kitchen", hint: "5,000–15,000" },
  { section: "kitchen", category: "Kitchen", description: "Countertops (quartz/granite)", unit: "sq ft", hint: "40–100" },
  { section: "kitchen", category: "Kitchen", description: "Appliance package (range, fridge, DW, micro)", unit: "set", hint: "2,500–6,000" },
  { section: "kitchen", category: "Kitchen", description: "Sink, faucet & garbage disposal", unit: "set", hint: "400–1,200" },
  { section: "kitchen", category: "Kitchen", description: "Backsplash tile", unit: "sq ft", hint: "10–30" },
  { section: "kitchen", category: "Kitchen", description: "Kitchen flooring", unit: "sq ft", hint: "4–10" },
  { section: "kitchen", category: "Kitchen", description: "Kitchen lighting & fixtures", unit: "job", hint: "300–1,200" },

  // ── Bathrooms ──
  { section: "bathrooms", category: "Bathroom", description: "Full bath remodel (tile, tub, surround)", unit: "bath", hint: "5,000–12,000" },
  { section: "bathrooms", category: "Bathroom", description: "Vanity, top & faucet", unit: "vanity", hint: "500–1,500" },
  { section: "bathrooms", category: "Bathroom", description: "Toilet (supply + install)", unit: "toilet", hint: "250–500" },
  { section: "bathrooms", category: "Bathroom", description: "Tub / shower replacement", unit: "unit", hint: "1,200–4,000" },
  { section: "bathrooms", category: "Bathroom", description: "Tile (floor & walls)", unit: "sq ft", hint: "8–25" },
  { section: "bathrooms", category: "Bathroom", description: "Bath fixtures, mirror & accessories", unit: "bath", hint: "200–600" },
  { section: "bathrooms", category: "Bathroom", description: "Exhaust fan", unit: "fan", hint: "150–400" },

  // ── Bedrooms ──
  { section: "bedrooms", category: "Bedroom", description: "Flooring (carpet or LVP)", unit: "sq ft", hint: "3–8" },
  { section: "bedrooms", category: "Bedroom", description: "Paint (walls, trim, ceiling)", unit: "room", hint: "300–700" },
  { section: "bedrooms", category: "Bedroom", description: "Closet shelving / system", unit: "closet", hint: "150–800" },
  { section: "bedrooms", category: "Bedroom", description: "Interior doors & hardware", unit: "door", hint: "150–400" },
  { section: "bedrooms", category: "Bedroom", description: "Lighting / ceiling fan", unit: "room", hint: "75–300" },

  // ── Living & Common Areas ──
  { section: "living", category: "Living", description: "Flooring (living/dining)", unit: "sq ft", hint: "4–10" },
  { section: "living", category: "Living", description: "Interior paint (common areas)", unit: "sq ft", hint: "2–4" },
  { section: "living", category: "Stairs", description: "Stairs & railings repair / refinish", unit: "job", hint: "800–4,000" },
  { section: "living", category: "Entry", description: "Entry / foyer finishes", unit: "job", hint: "300–1,500" },
  { section: "living", category: "Trim", description: "Trim, baseboards & crown", unit: "linear ft", hint: "2–6" },
  { section: "living", category: "Drywall", description: "Drywall repair / texture", unit: "job", hint: "500–3,000" },

  // ── Laundry & Utility ──
  { section: "laundry", category: "Laundry", description: "Washer/dryer hookups", unit: "job", hint: "400–1,500" },
  { section: "laundry", category: "Laundry", description: "Laundry flooring", unit: "sq ft", hint: "4–10" },
  { section: "laundry", category: "Laundry", description: "Utility sink & cabinetry", unit: "job", hint: "300–1,200" },

  // ── Garage ──
  { section: "garage", category: "Garage", description: "Garage door & opener", unit: "door", hint: "800–2,500" },
  { section: "garage", category: "Garage", description: "Garage floor (epoxy / repair)", unit: "sq ft", hint: "3–8" },
  { section: "garage", category: "Garage", description: "Drywall & paint", unit: "job", hint: "800–2,500" },
  { section: "garage", category: "Garage", description: "Shelving / storage", unit: "job", hint: "200–1,000" },

  // ── Basement & Attic ──
  { section: "basement", category: "Basement", description: "Waterproofing / sump pump", unit: "job", hint: "1,500–8,000" },
  { section: "basement", category: "Basement", description: "Basement finishing", unit: "sq ft", hint: "20–50" },
  { section: "basement", category: "Attic", description: "Insulation (attic / walls)", unit: "sq ft", hint: "1–3" },
  { section: "basement", category: "Egress", description: "Egress window / code items", unit: "job", hint: "1,500–5,000" },

  // ── Landscaping & Site ──
  { section: "landscape", category: "Landscaping", description: "Sod / seed & lawn restoration", unit: "sq ft", hint: "1–3" },
  { section: "landscape", category: "Landscaping", description: "Plants, mulch & beds", unit: "job", hint: "500–3,000" },
  { section: "landscape", category: "Landscaping", description: "Tree trimming / removal", unit: "job", hint: "500–3,000" },
  { section: "landscape", category: "Site", description: "Grading & drainage", unit: "job", hint: "1,000–6,000" },
  { section: "landscape", category: "Site", description: "Walkways / hardscape", unit: "job", hint: "800–4,000" },
  { section: "landscape", category: "Site", description: "Irrigation / sprinklers", unit: "job", hint: "1,500–5,000" },

  // ── Pool & Outbuildings ──
  { section: "pool", category: "Pool", description: "Pool resurface / repair", unit: "job", hint: "4,000–15,000" },
  { section: "pool", category: "Pool", description: "Pool equipment (pump, filter, heater)", unit: "job", hint: "1,500–6,000" },
  { section: "pool", category: "Outbuilding", description: "Shed repair / replacement", unit: "job", hint: "1,000–6,000" },
  { section: "pool", category: "Outbuilding", description: "Detached garage / structure", unit: "job", hint: "3,000–20,000" },

  // ── General Conditions ──
  { section: "general", category: "General", description: "Permits & fees", unit: "job", hint: "300–3,000" },
  { section: "general", category: "General", description: "Dumpster / debris removal & trash-out", unit: "job", hint: "400–2,000" },
  { section: "general", category: "General", description: "Final deep clean", unit: "job", hint: "300–800" },
  { section: "general", category: "General", description: "Staging (per month)", unit: "month", hint: "1,500–3,000" },
];

let counter = 0;
export function newId(): string {
  counter += 1;
  return `si_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultScopeItems(): ScopeItem[] {
  return TEMPLATE.map((row) => ({
    id: newId(),
    tier: SECTION_META[row.section].tier,
    section: row.section,
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

export function blankItem(section: SectionKey): ScopeItem {
  return {
    id: newId(),
    tier: SECTION_META[section].tier,
    section,
    category: "Custom",
    description: "",
    quantity: "1",
    unitCost: "",
    unit: "job",
  };
}

// ── User-added rooms ──

interface RoomLine {
  description: string;
  unit: string;
  hint: string;
}

interface RoomTypeDef {
  label: string; // base name (auto-numbered when repeated)
  tier: Tier;
  lines: RoomLine[];
}

export const ROOM_TYPES: { type: RoomType; menuLabel: string }[] = [
  { type: "bedroom", menuLabel: "Bedroom" },
  { type: "bathroom", menuLabel: "Bathroom (full)" },
  { type: "halfbath", menuLabel: "Half Bath" },
  { type: "kitchen", menuLabel: "Kitchen / Kitchenette" },
  { type: "living", menuLabel: "Living / Family Room" },
  { type: "dining", menuLabel: "Dining Room" },
  { type: "office", menuLabel: "Office / Den" },
  { type: "bonus", menuLabel: "Bonus / Flex Room" },
  { type: "sunroom", menuLabel: "Sunroom" },
  { type: "mudroom", menuLabel: "Mudroom / Entry" },
  { type: "custom", menuLabel: "Custom Room" },
];

const ROOM_DEFS: Record<RoomType, RoomTypeDef> = {
  bedroom: {
    label: "Bedroom",
    tier: 3,
    lines: [
      { description: "Flooring (carpet or LVP)", unit: "sq ft", hint: "3–8" },
      { description: "Paint (walls, trim, ceiling)", unit: "room", hint: "300–700" },
      { description: "Closet shelving / system", unit: "closet", hint: "150–800" },
      { description: "Interior door & hardware", unit: "door", hint: "150–400" },
      { description: "Lighting / ceiling fan", unit: "room", hint: "75–300" },
    ],
  },
  bathroom: {
    label: "Bathroom",
    tier: 2,
    lines: [
      { description: "Vanity, top & faucet", unit: "vanity", hint: "500–1,500" },
      { description: "Toilet (supply + install)", unit: "toilet", hint: "250–500" },
      { description: "Tub / shower replacement", unit: "unit", hint: "1,200–4,000" },
      { description: "Tile (floor & walls)", unit: "sq ft", hint: "8–25" },
      { description: "Fixtures, mirror & accessories", unit: "bath", hint: "200–600" },
      { description: "Exhaust fan", unit: "fan", hint: "150–400" },
    ],
  },
  halfbath: {
    label: "Half Bath",
    tier: 2,
    lines: [
      { description: "Vanity, top & faucet", unit: "vanity", hint: "400–1,200" },
      { description: "Toilet (supply + install)", unit: "toilet", hint: "250–500" },
      { description: "Fixtures & mirror", unit: "bath", hint: "150–400" },
      { description: "Flooring", unit: "sq ft", hint: "4–12" },
      { description: "Paint", unit: "room", hint: "150–400" },
    ],
  },
  kitchen: {
    label: "Kitchen",
    tier: 2,
    lines: [
      { description: "Cabinets (supply + install)", unit: "kitchen", hint: "5,000–15,000" },
      { description: "Countertops (quartz/granite)", unit: "sq ft", hint: "40–100" },
      { description: "Appliance package", unit: "set", hint: "2,500–6,000" },
      { description: "Sink, faucet & disposal", unit: "set", hint: "400–1,200" },
      { description: "Backsplash tile", unit: "sq ft", hint: "10–30" },
      { description: "Flooring", unit: "sq ft", hint: "4–10" },
      { description: "Lighting & fixtures", unit: "job", hint: "300–1,200" },
    ],
  },
  living: {
    label: "Living Room",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–10" },
      { description: "Paint (walls, trim, ceiling)", unit: "room", hint: "400–900" },
      { description: "Lighting / ceiling fan", unit: "room", hint: "100–400" },
      { description: "Trim & baseboards", unit: "linear ft", hint: "2–6" },
    ],
  },
  dining: {
    label: "Dining Room",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–10" },
      { description: "Paint (walls, trim, ceiling)", unit: "room", hint: "300–700" },
      { description: "Lighting fixture", unit: "fixture", hint: "150–600" },
    ],
  },
  office: {
    label: "Office",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–10" },
      { description: "Paint (walls, trim, ceiling)", unit: "room", hint: "300–700" },
      { description: "Lighting", unit: "room", hint: "100–400" },
      { description: "Built-ins / shelving", unit: "job", hint: "500–3,000" },
    ],
  },
  bonus: {
    label: "Bonus Room",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–10" },
      { description: "Paint (walls, trim, ceiling)", unit: "room", hint: "300–800" },
      { description: "Lighting", unit: "room", hint: "100–400" },
    ],
  },
  sunroom: {
    label: "Sunroom",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–12" },
      { description: "Paint / finishes", unit: "room", hint: "300–800" },
      { description: "Windows / glass", unit: "window", hint: "400–900" },
      { description: "Lighting", unit: "room", hint: "100–400" },
    ],
  },
  mudroom: {
    label: "Mudroom",
    tier: 3,
    lines: [
      { description: "Flooring", unit: "sq ft", hint: "4–12" },
      { description: "Built-in storage / lockers", unit: "job", hint: "500–3,000" },
      { description: "Paint", unit: "room", hint: "200–500" },
    ],
  },
  custom: {
    label: "Room",
    tier: 3,
    lines: [{ description: "", unit: "job", hint: "0" }],
  },
};

const ROOM_HINTS = new Map<string, string>();
for (const def of Object.values(ROOM_DEFS)) {
  for (const line of def.lines) {
    if (line.hint && line.hint !== "0") ROOM_HINTS.set(line.description, `$${line.hint}`);
  }
}

/** Auto-numbered name: "Bedroom", then "Bedroom 2", "Bedroom 3"… */
function nextRoomName(rooms: CustomRoom[], type: RoomType): string {
  const base = ROOM_DEFS[type].label;
  const sameType = rooms.filter((r) => r.type === type).length;
  return sameType === 0 ? base : `${base} ${sameType + 1}`;
}

/** Create a new room plus its starter line items. */
export function makeRoom(
  type: RoomType,
  existingRooms: CustomRoom[]
): { room: CustomRoom; items: ScopeItem[] } {
  const def = ROOM_DEFS[type];
  const room: CustomRoom = {
    id: `room_${newId()}`,
    name: nextRoomName(existingRooms, type),
    type,
    tier: def.tier,
  };
  const items: ScopeItem[] = def.lines.map((line) => ({
    id: newId(),
    tier: def.tier,
    roomId: room.id,
    category: def.label,
    description: line.description,
    quantity: "",
    unitCost: "",
    unit: line.unit,
  }));
  return { room, items };
}

/** Blank custom line item that belongs to a room. */
export function blankRoomItem(room: CustomRoom): ScopeItem {
  return {
    id: newId(),
    tier: room.tier,
    roomId: room.id,
    category: room.name,
    description: "",
    quantity: "1",
    unitCost: "",
    unit: "job",
  };
}

/** Cost hint for a description, checking both the fixed template and room lines. */
export function hintFor(description: string): string {
  const fixed = templateHint(description);
  if (fixed !== "0") return fixed;
  return ROOM_HINTS.get(description) ?? "0";
}
