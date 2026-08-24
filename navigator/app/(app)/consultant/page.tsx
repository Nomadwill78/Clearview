import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { embeddedOne, type EmbeddedKpi } from "@/lib/supabase/embedded";
import ChatWindow from "@/components/consultant/chat";
import ActionPlan from "@/components/consultant/action-plan";

export default async function ConsultantPage() {
  const { userId } = await auth();
  const supabase = await createServerClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("clerk_user_id", userId!)
    .single();

  if (!member) return null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content, cited_sources, created_at")
    .eq("org_id", member.org_id)
    .order("created_at", { ascending: true })
    .limit(100);

  const { data: actionItems } = await supabase
    .from("action_items")
    .select("id, title, description, assigned_role, suggested_due_date, status, kpi_definitions(name, domain)")
    .eq("org_id", member.org_id)
    .order("updated_at", { ascending: false });

  const items = (actionItems ?? []).map((item) => ({
    ...item,
    kpi_definitions: embeddedOne<EmbeddedKpi>(item.kpi_definitions),
  }));

  const canEdit = ["admin", "leadership"].includes(member.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif" style={{ color: "var(--color-navy)" }}>
          Virtual Consultant
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask any question about your organization&apos;s performance. Your data, your context.
        </p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <ChatWindow
          orgId={member.org_id}
          initialMessages={messages ?? []}
        />
        <ActionPlan
          orgId={member.org_id}
          items={items}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
