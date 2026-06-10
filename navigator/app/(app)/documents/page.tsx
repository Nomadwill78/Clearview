import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import UploadZone from "@/components/documents/upload-zone";
import DocumentList from "@/components/documents/document-list";

export default async function DocumentsPage() {
  const { userId } = await auth();
  const supabase = await createServerClient();

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("clerk_user_id", userId!)
    .single();

  const canUpload = member && ["admin", "staff"].includes(member.role);

  const { data: documents } = member
    ? await supabase
        .from("documents")
        .select("id, file_name, category, processing_status, created_at, file_size_bytes")
        .eq("org_id", member.org_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif" style={{ color: "var(--color-navy)" }}>Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload reports and documents to extract KPI data automatically.
        </p>
      </div>

      {canUpload && member && (
        <UploadZone orgId={member.org_id} memberId={member.org_id} />
      )}

      <DocumentList documents={documents ?? []} canUpload={!!canUpload} />
    </div>
  );
}
