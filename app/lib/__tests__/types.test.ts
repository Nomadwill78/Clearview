import { describe, it, expect } from "vitest";
import {
  itemTotal,
  scopeSubtotal,
  scopeTotal,
  tierSubtotal,
  sectionSubtotal,
  roomSubtotal,
  itemSection,
  CONTINGENCY_PCT,
} from "@/app/lib/types";
import type { ScopeItem } from "@/app/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<ScopeItem> = {}): ScopeItem {
  return {
    id: "test-1",
    tier: 3,
    section: "living",
    category: "Custom",
    description: "Test item",
    quantity: "2",
    unitCost: "500",
    unit: "job",
    ...overrides,
  };
}

// ── itemTotal ─────────────────────────────────────────────────────────────────

describe("itemTotal", () => {
  it("multiplies quantity × unitCost", () => {
    expect(itemTotal(makeItem({ quantity: "3", unitCost: "1500" }))).toBe(4500);
  });

  it("returns 0 when quantity is 0", () => {
    expect(itemTotal(makeItem({ quantity: "0", unitCost: "500" }))).toBe(0);
  });

  it("returns 0 when unitCost is 0", () => {
    expect(itemTotal(makeItem({ quantity: "5", unitCost: "0" }))).toBe(0);
  });

  it("returns 0 when quantity is empty string", () => {
    expect(itemTotal(makeItem({ quantity: "", unitCost: "500" }))).toBe(0);
  });

  it("returns 0 when unitCost is empty string", () => {
    expect(itemTotal(makeItem({ quantity: "3", unitCost: "" }))).toBe(0);
  });

  it("returns 0 when either value is non-numeric", () => {
    expect(itemTotal(makeItem({ quantity: "abc", unitCost: "500" }))).toBe(0);
    expect(itemTotal(makeItem({ quantity: "3", unitCost: "abc" }))).toBe(0);
  });

  it("returns 0 for negative values", () => {
    expect(itemTotal(makeItem({ quantity: "-2", unitCost: "500" }))).toBe(0);
    expect(itemTotal(makeItem({ quantity: "2", unitCost: "-500" }))).toBe(0);
  });

  it("handles decimal values", () => {
    expect(itemTotal(makeItem({ quantity: "1.5", unitCost: "200" }))).toBeCloseTo(300);
  });
});

// ── scopeSubtotal ─────────────────────────────────────────────────────────────

describe("scopeSubtotal", () => {
  it("returns 0 for empty list", () => {
    expect(scopeSubtotal([])).toBe(0);
  });

  it("sums all item totals", () => {
    const items = [
      makeItem({ id: "a", quantity: "2", unitCost: "1000" }),
      makeItem({ id: "b", quantity: "3", unitCost: "500" }),
      makeItem({ id: "c", quantity: "1", unitCost: "250" }),
    ];
    expect(scopeSubtotal(items)).toBe(3750);
  });

  it("ignores unpriced items (empty strings)", () => {
    const items = [
      makeItem({ id: "a", quantity: "2", unitCost: "1000" }),
      makeItem({ id: "b", quantity: "", unitCost: "" }),
    ];
    expect(scopeSubtotal(items)).toBe(2000);
  });
});

// ── scopeTotal ────────────────────────────────────────────────────────────────

describe("scopeTotal", () => {
  const items = [makeItem({ quantity: "1", unitCost: "10000" })];

  it("returns subtotal unchanged when contingency is disabled", () => {
    expect(scopeTotal(items, false)).toBe(10000);
  });

  it("adds 15% contingency when enabled", () => {
    expect(scopeTotal(items, true)).toBeCloseTo(10000 * (1 + CONTINGENCY_PCT));
  });

  it("CONTINGENCY_PCT is 0.15", () => {
    expect(CONTINGENCY_PCT).toBe(0.15);
  });
});

// ── tierSubtotal ──────────────────────────────────────────────────────────────

describe("tierSubtotal", () => {
  const items = [
    makeItem({ id: "a", tier: 1, quantity: "1", unitCost: "5000" }),
    makeItem({ id: "b", tier: 2, quantity: "1", unitCost: "3000" }),
    makeItem({ id: "c", tier: 2, quantity: "1", unitCost: "2000" }),
    makeItem({ id: "d", tier: 3, quantity: "1", unitCost: "1000" }),
  ];

  it("sums only tier-1 items", () => {
    expect(tierSubtotal(items, 1)).toBe(5000);
  });

  it("sums only tier-2 items", () => {
    expect(tierSubtotal(items, 2)).toBe(5000);
  });

  it("sums only tier-3 items", () => {
    expect(tierSubtotal(items, 3)).toBe(1000);
  });

  it("returns 0 when no items match the tier", () => {
    const t1Only = [makeItem({ tier: 1, quantity: "1", unitCost: "1000" })];
    expect(tierSubtotal(t1Only, 2)).toBe(0);
  });
});

// ── sectionSubtotal ───────────────────────────────────────────────────────────

describe("sectionSubtotal", () => {
  const items = [
    makeItem({ id: "a", section: "kitchen", roomId: undefined, quantity: "1", unitCost: "8000" }),
    makeItem({ id: "b", section: "kitchen", roomId: undefined, quantity: "1", unitCost: "2000" }),
    makeItem({ id: "c", section: "systems", roomId: undefined, quantity: "1", unitCost: "5000" }),
    // room item with kitchen section is excluded from fixed-area totals
    makeItem({ id: "d", section: "kitchen", roomId: "room_1", quantity: "1", unitCost: "3000" }),
  ];

  it("sums only fixed-area kitchen items (excludes room items)", () => {
    expect(sectionSubtotal(items, "kitchen")).toBe(10000);
  });

  it("sums systems items", () => {
    expect(sectionSubtotal(items, "systems")).toBe(5000);
  });

  it("returns 0 for a section with no items", () => {
    expect(sectionSubtotal(items, "garage")).toBe(0);
  });
});

// ── roomSubtotal ──────────────────────────────────────────────────────────────

describe("roomSubtotal", () => {
  const items = [
    makeItem({ id: "a", roomId: "room_1", quantity: "1", unitCost: "1500" }),
    makeItem({ id: "b", roomId: "room_1", quantity: "2", unitCost: "300" }),
    makeItem({ id: "c", roomId: "room_2", quantity: "1", unitCost: "5000" }),
    makeItem({ id: "d", roomId: undefined, quantity: "1", unitCost: "9000" }),
  ];

  it("sums only items belonging to the given room", () => {
    expect(roomSubtotal(items, "room_1")).toBe(2100);
  });

  it("does not include items from other rooms", () => {
    expect(roomSubtotal(items, "room_2")).toBe(5000);
  });

  it("returns 0 for an unknown room id", () => {
    expect(roomSubtotal(items, "room_99")).toBe(0);
  });
});

// ── itemSection ───────────────────────────────────────────────────────────────

describe("itemSection", () => {
  it("returns explicit section when set and valid", () => {
    expect(itemSection(makeItem({ section: "garage" }))).toBe("garage");
  });

  it("infers 'systems' from HVAC category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 1, category: "HVAC replacement" }))).toBe("systems");
  });

  it("infers 'kitchen' from kitchen category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 2, category: "Kitchen cabinets" }))).toBe("kitchen");
  });

  it("infers 'bathrooms' from bathroom category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 2, category: "Bathroom tile" }))).toBe("bathrooms");
  });

  it("infers 'systems' for tier-1 items with no matching category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 1, category: "Unknown critical" }))).toBe("systems");
  });

  it("infers 'kitchen' for tier-2 items with no matching category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 2, category: "Unknown wet room" }))).toBe("kitchen");
  });

  it("infers 'living' for tier-3 items with no matching category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 3, category: "Unknown cosmetic" }))).toBe("living");
  });

  it("infers 'landscape' from landscaping category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 3, category: "Landscaping & sod" }))).toBe("landscape");
  });

  it("infers 'garage' from garage category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 3, category: "Garage door" }))).toBe("garage");
  });

  it("infers 'general' from staging category", () => {
    expect(itemSection(makeItem({ section: undefined, tier: 3, category: "Staging setup" }))).toBe("general");
  });
});
