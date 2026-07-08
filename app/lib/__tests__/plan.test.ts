import { describe, it, expect, beforeEach } from "vitest";
import { readFreePdfExports, markFreePdfExportUsed } from "@/app/lib/plan";

const FREE_PDF_KEY = "flipos.freePdfExports.v1";

describe("free sample PDF tracking", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with no deals having used their sample", () => {
    expect(readFreePdfExports()).toEqual({});
  });

  it("marks a deal's sample as used and persists it", () => {
    markFreePdfExportUsed("deal_a");
    expect(readFreePdfExports()).toEqual({ deal_a: true });
    // survives a fresh read from storage
    expect(JSON.parse(window.localStorage.getItem(FREE_PDF_KEY)!)).toEqual({ deal_a: true });
  });

  it("tracks deals independently", () => {
    markFreePdfExportUsed("deal_a");
    markFreePdfExportUsed("deal_b");
    const map = readFreePdfExports();
    expect(map.deal_a).toBe(true);
    expect(map.deal_b).toBe(true);
    expect(map.deal_c).toBeUndefined();
  });

  it("recovers from corrupted storage", () => {
    window.localStorage.setItem(FREE_PDF_KEY, "not json{");
    expect(readFreePdfExports()).toEqual({});
    window.localStorage.setItem(FREE_PDF_KEY, JSON.stringify(["array", "not", "map"]));
    expect(readFreePdfExports()).toEqual({});
  });
});
