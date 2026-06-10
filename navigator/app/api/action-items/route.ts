import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, orgId } = await req.json() as { id: string; status: string; orgId: string };

  const supabase = createServiceClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("clerk_user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (!member || !["admin", "leadership"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase
    .from("action_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);

  return NextResponse.json({ ok: true });
}
