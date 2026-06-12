// PDF scope-of-work generator. Loaded on demand (dynamic import) so the
// heavy @react-pdf/renderer bundle never slows down the main app.
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Deal, ScopeItem, Tier } from "@/app/lib/types";
import {
  TIER_INFO,
  CONTINGENCY_PCT,
  itemTotal,
  scopeSubtotal,
  tierSubtotal,
} from "@/app/lib/types";

const AMBER = "#b45309";
const SLATE_DARK = "#0f172a";
const SLATE_MID = "#475569";
const SLATE_LIGHT = "#94a3b8";
const ROW_BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: SLATE_DARK,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: AMBER,
    paddingBottom: 10,
    marginBottom: 6,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  brandAccent: { color: AMBER },
  docTitle: { fontSize: 11, color: SLATE_MID },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    marginTop: 8,
  },
  address: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  date: { fontSize: 10, color: SLATE_MID },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 14,
    marginBottom: 2,
  },
  tierName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  tierSub: { fontSize: 8, color: SLATE_LIGHT, marginTop: 1 },
  colHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: SLATE_MID,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_BORDER,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  colCategory: { width: "18%", color: SLATE_MID },
  colDesc: { width: "44%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "13%", textAlign: "right" },
  colTotal: { width: "13%", textAlign: "right" },
  headText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SLATE_MID, textTransform: "uppercase" },
  tierSubtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  totalsBlock: {
    marginTop: 20,
    marginLeft: "50%",
    borderTopWidth: 2,
    borderTopColor: SLATE_DARK,
    paddingTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AMBER,
  },
  grandText: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  grandAmount: { fontSize: 12, fontFamily: "Helvetica-Bold", color: AMBER },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: ROW_BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: SLATE_LIGHT },
});

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtQty(item: ScopeItem): string {
  const qty = parseFloat(item.quantity);
  if (isNaN(qty) || qty <= 0) return "—";
  const label = item.unit && item.unit !== "job" ? ` ${item.unit}` : "";
  return `${qty.toLocaleString("en-US")}${label}`;
}

function ScopeDocument({ deal }: { deal: Deal }) {
  // Only items priced into the budget appear on the contractor document
  const included = deal.scopeItems.filter((it) => itemTotal(it) > 0);
  const subtotal = scopeSubtotal(included);
  const contingency = deal.contingencyEnabled ? subtotal * CONTINGENCY_PCT : 0;
  const grand = subtotal + contingency;
  const address = deal.form.address.trim() || "Property address TBD";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const tiers: Tier[] = [1, 2, 3];

  return (
    <Document title={`Scope of Work — ${address}`} author="FlipOS">
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.brand}>
            <Text style={styles.brandAccent}>Flip</Text>OS
          </Text>
          <Text style={styles.docTitle}>Scope of Work — Renovation</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.address}>{address}</Text>
          <Text style={styles.date}>Prepared {today}</Text>
        </View>

        {/* Tiers */}
        {tiers.map((tier) => {
          const tierItems = included.filter((it) => it.tier === tier);
          if (tierItems.length === 0) return null;
          return (
            <View key={tier} wrap={false}>
              <View style={styles.tierHeader}>
                <View>
                  <Text style={styles.tierName}>
                    Tier {tier} — {TIER_INFO[tier].name}
                  </Text>
                  <Text style={styles.tierSub}>{TIER_INFO[tier].subtitle}</Text>
                </View>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10 }}>
                  {usd(tierSubtotal(included, tier))}
                </Text>
              </View>

              <View style={styles.colHead}>
                <Text style={[styles.colCategory, styles.headText]}>Category</Text>
                <Text style={[styles.colDesc, styles.headText]}>Description</Text>
                <Text style={[styles.colQty, styles.headText]}>Qty</Text>
                <Text style={[styles.colUnit, styles.headText]}>Unit Cost</Text>
                <Text style={[styles.colTotal, styles.headText]}>Total</Text>
              </View>

              {tierItems.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Text style={styles.colCategory}>{item.category}</Text>
                  <Text style={styles.colDesc}>{item.description || "—"}</Text>
                  <Text style={styles.colQty}>{fmtQty(item)}</Text>
                  <Text style={styles.colUnit}>{usd(parseFloat(item.unitCost) || 0)}</Text>
                  <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
                    {usd(itemTotal(item))}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totalsBlock} wrap={false}>
          <View style={styles.totalsRow}>
            <Text style={{ color: SLATE_MID }}>Scope Subtotal</Text>
            <Text>{usd(subtotal)}</Text>
          </View>
          {deal.contingencyEnabled && (
            <View style={styles.totalsRow}>
              <Text style={{ color: SLATE_MID }}>Contingency (15%)</Text>
              <Text>{usd(contingency)}</Text>
            </View>
          )}
          <View style={styles.grandRow}>
            <Text style={styles.grandText}>Total Rehab Budget</Text>
            <Text style={styles.grandAmount}>{usd(grand)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Scope of Work · {address}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadScopePdf(deal: Deal): Promise<void> {
  const blob = await pdf(<ScopeDocument deal={deal} />).toBlob();
  const safeAddress =
    deal.form.address.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "scope-of-work";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `FlipOS-Scope-${safeAddress}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
