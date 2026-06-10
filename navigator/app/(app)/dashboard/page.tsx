import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import DomainCard from "@/components/kpi/domain-card";
import { TrendingUp, FileText, CheckSquare, AlertTriangle } from "lucide-react";
import Link from "next/link";

const DOMAINS = ["financial", "program", "governance", "fundraising", "operations"] as const;

const DOMAIN_LABELS: Record<string, string> = {
  financial: "Financial Health",
  program: "Program Impact",
  governance: "Governance",
  fundraising: "Fundraising",
  operations: "Operations",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  const supabase = await createServerClient();

  // Resolve org membership
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("clerk_user_id", userId!)
    .single();

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertTriangle size={32} className="mb-4" style={{ color: "var(--color-warning)" }} />
        <h2 className="text-xl font-serif mb-2" style={{ color: "var(--color-navy)" }}>No organization found</h2>
        <p className="text-sm text-gray-500 mb-6">Ask your admin to invite you, or set up your organization in Settings.</p>
        <Link href="/settings" className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--color-navy)" }}>
          Go to Settings
        </Link>
      </div>
    );
  }

  const { org_id } = member;

  // Fetch org
  const { data: org } = await supabase
    .from("organizations")
    .select("name, subscription_tier")
    .eq("id", org_id)
    .single();

  // Fetch latest KPI scores per domain
  const { data: scores } = await supabase
    .from("kpi_scores")
    .select("score, period_label, kpi_definitions(domain, name)")
    .eq("org_id", org_id)
    .order("computed_at", { ascending: false });

  // Fetch document counts
  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org_id);

  // Fetch open action items
  const { count: openItems } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org_id)
    .eq("status", "open");

  const { count: doneItems } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org_id)
    .eq("status", "complete");

  // Build per-domain average scores
  const domainScores: Record<string, { avg: number; count: number }> = {};
  for (const s of scores ?? []) {
    const domain = (s.kpi_definitions as { domain: string } | null)?.domain;
    if (!domain) continue;
    if (!domainScores[domain]) domainScores[domain] = { avg: 0, count: 0 };
    domainScores[domain].avg += s.score;
    domainScores[domain].count += 1;
  }
  for (const d of Object.keys(domainScores)) {
    domainScores[d].avg = domainScores[d].avg / domainScores[d].count;
  }

  const overallScore =
    Object.values(domainScores).length > 0
      ? Object.values(domainScores).reduce((sum, d) => sum + d.avg, 0) /
        Object.values(domainScores).length
      : null;

  const hasData = (scores?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif" style={{ color: "var(--color-navy)" }}>
          {org?.name ?? "Your Organization"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Organizational health overview</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Overall Score",
            value: overallScore ? `${overallScore.toFixed(1)}/5` : "—",
            icon: TrendingUp,
            color: overallScore && overallScore >= 3.5 ? "var(--color-success)" : overallScore ? "var(--color-warning)" : "var(--color-navy)",
          },
          { label: "Documents", value: docCount ?? 0, icon: FileText, color: "var(--color-navy)" },
          { label: "Open Actions", value: openItems ?? 0, icon: AlertTriangle, color: "var(--color-warning)" },
          { label: "Completed", value: doneItems ?? 0, icon: CheckSquare, color: "var(--color-success)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{label}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="text-2xl font-serif" style={{ color: "var(--color-navy)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* No data state */}
      {!hasData && (
        <div className="rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
          <FileText size={32} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-serif text-lg mb-2" style={{ color: "var(--color-navy)" }}>
            No KPI data yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload your first document to get your KPI scores and improvement roadmap.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: "var(--color-navy)" }}
          >
            Upload documents
          </Link>
        </div>
      )}

      {/* Domain cards */}
      {hasData && (
        <div>
          <h2 className="text-lg font-serif mb-4" style={{ color: "var(--color-navy)" }}>
            Performance by Domain
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DOMAINS.map((domain) => (
              <DomainCard
                key={domain}
                domain={domain}
                label={DOMAIN_LABELS[domain]}
                score={domainScores[domain]?.avg ?? null}
                kpiCount={domainScores[domain]?.count ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action plan CTA */}
      {hasData && (openItems ?? 0) > 0 && (
        <div
          className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: "var(--color-navy)" }}
        >
          <div>
            <p className="text-white font-serif">Your action plan is ready</p>
            <p className="text-white/60 text-sm mt-0.5">
              {openItems} open item{openItems !== 1 ? "s" : ""} waiting for your attention
            </p>
          </div>
          <Link
            href="/consultant"
            className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
            style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
          >
            View plan
          </Link>
        </div>
      )}
    </div>
  );
}
