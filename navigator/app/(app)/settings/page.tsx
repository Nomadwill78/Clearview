import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { Users, CreditCard, Building2, AlertTriangle } from "lucide-react";

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default async function SettingsPage() {
  const { userId } = await auth();
  const supabase = await createServerClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("clerk_user_id", userId!)
    .single();

  const { data: org } = member
    ? await supabase.from("organizations").select("*").eq("id", member.org_id).single()
    : { data: null };

  const { data: members } = member
    ? await supabase
        .from("org_members")
        .select("id, role, clerk_user_id, joined_at")
        .eq("org_id", member.org_id)
    : { data: [] };

  const isAdmin = member?.role === "admin";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif" style={{ color: "var(--color-navy)" }}>Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization, team, and subscription.</p>
      </div>

      {/* Org info */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={16} style={{ color: "var(--color-navy)" }} />
          <h2 className="font-serif text-base" style={{ color: "var(--color-navy)" }}>Organization</h2>
        </div>
        {org ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Name</p>
              <p className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>{org.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
              >
                {TIER_LABELS[org.subscription_tier] ?? org.subscription_tier}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: org.subscription_status === "active" ? "#dcfce7" : "#fee2e2",
                  color: org.subscription_status === "active" ? "#15803d" : "#dc2626",
                }}
              >
                {org.subscription_status}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertTriangle size={14} />
            No organization linked to your account yet.
          </div>
        )}
      </section>

      {/* Team members */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--color-navy)" }} />
            <h2 className="font-serif text-base" style={{ color: "var(--color-navy)" }}>Team</h2>
          </div>
          <span className="text-xs text-gray-400">{members?.length ?? 0} / 5 seats</span>
        </div>

        <div className="divide-y divide-gray-50">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm" style={{ color: "var(--color-navy)" }}>{m.clerk_user_id}</p>
                <p className="text-xs text-gray-400">
                  Joined {new Date(m.joined_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-gray-100 text-gray-600">
                {m.role}
              </span>
            </div>
          ))}
        </div>

        {isAdmin && (members?.length ?? 0) < 5 && (
          <p className="text-xs text-gray-400">
            Invite teammates via your Clerk organization dashboard. Assign roles of <strong>leadership</strong>, <strong>staff</strong>, or <strong>board</strong>.
          </p>
        )}
      </section>

      {/* Billing */}
      {isAdmin && (
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard size={16} style={{ color: "var(--color-navy)" }} />
            <h2 className="font-serif text-base" style={{ color: "var(--color-navy)" }}>Billing</h2>
          </div>
          <p className="text-sm text-gray-500">
            Manage your subscription, upgrade, or cancel through the Stripe customer portal.
          </p>
          <form action="/api/billing/portal" method="POST">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--color-navy)" }}
            >
              Open billing portal
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
