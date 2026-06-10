import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

const ALLOWED_TYPES = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const category = form.get("category") as string | null;
  const orgId = form.get("orgId") as string | null;
  const memberId = form.get("memberId") as string | null;

  if (!file || !category || !orgId || !memberId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the user is a member of this org with upload permission
  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("clerk_user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (!member || !["admin", "staff"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check org storage usage
  const { data: org } = await supabase
    .from("organizations")
    .select("subscription_tier")
    .eq("id", orgId)
    .single();

  const storageLimits: Record<string, number> = {
    starter: 100 * 1024 * 1024,
    professional: 500 * 1024 * 1024,
    enterprise: Infinity,
  };
  const limit = storageLimits[org?.subscription_tier ?? "starter"];

  const { data: usage } = await supabase
    .from("documents")
    .select("file_size_bytes")
    .eq("org_id", orgId);

  const currentUsage = (usage ?? []).reduce((sum, d) => sum + d.file_size_bytes, 0);
  if (currentUsage + file.size > limit) {
    return NextResponse.json({ error: "Storage limit reached. Upgrade your plan." }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${orgId}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, bytes, { contentType: file.type });

  if (storageError) {
    return NextResponse.json({ error: `Storage error: ${storageError.message}` }, { status: 500 });
  }

  // Insert document record
  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .insert({
      org_id: orgId,
      uploaded_by: memberId,
      category,
      file_name: file.name,
      storage_path: storagePath,
      file_size_bytes: file.size,
      processing_status: "pending",
    })
    .select("id")
    .single();

  if (dbError || !doc) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Enqueue extraction job
  await inngest.send({ name: "document/uploaded", data: { documentId: doc.id, orgId } });

  return NextResponse.json({ documentId: doc.id, status: "pending" });
}
