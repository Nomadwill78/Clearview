import { FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface Doc {
  id: string;
  file_name: string;
  category: string;
  processing_status: string;
  created_at: string;
  file_size_bytes: number;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock size={14} className="text-gray-400" />,
  processing: <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-navy)" }} />,
  complete:   <CheckCircle size={14} style={{ color: "var(--color-success)" }} />,
  failed:     <XCircle size={14} style={{ color: "var(--color-danger)" }} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  financial:   "Financial",
  program:     "Program",
  governance:  "Governance",
  fundraising: "Fundraising",
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, canUpload }: { documents: Doc[]; canUpload: boolean }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">{canUpload ? "No documents yet. Upload your first document above." : "No documents uploaded yet."}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-serif mb-3" style={{ color: "var(--color-navy)" }}>
        Uploaded documents
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
            <FileText size={16} style={{ color: "var(--color-navy)", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-navy)" }}>
                {doc.file_name}
              </p>
              <p className="text-xs text-gray-400">
                {CATEGORY_LABELS[doc.category] ?? doc.category} · {fmtSize(doc.file_size_bytes)} · {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {STATUS_ICON[doc.processing_status] ?? STATUS_ICON.pending}
              <span className="text-xs text-gray-400 capitalize">{doc.processing_status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
