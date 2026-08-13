"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const CATEGORIES = [
  { value: "financial",   label: "Financial (990, audit, budget)" },
  { value: "program",     label: "Program / Impact report" },
  { value: "governance",  label: "Governance (minutes, bylaws)" },
  { value: "fundraising", label: "Fundraising / Donor report" },
];

const ACCEPT = ".pdf,.xlsx,.xls,.csv,.docx,.doc";

interface Props {
  orgId: string;
  memberId: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadZone({ orgId, memberId }: Props) {
  const [category, setCategory] = useState("financial");
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      setState("error");
      setMessage("File exceeds the 25 MB limit.");
      return;
    }

    setState("uploading");
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    form.append("orgId", orgId);
    form.append("memberId", memberId);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setState("success");
      setMessage(`${file.name} uploaded. Extracting KPIs in the background…`);
      setTimeout(() => { setState("idle"); setMessage(""); }, 4000);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-3">
      {/* Category selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>
          Document type
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          style={{ color: "var(--color-navy)" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className="rounded-xl border-2 border-dashed cursor-pointer transition-all p-10 text-center"
        style={{
          borderColor: dragging ? "var(--color-navy)" : "#d1d5db",
          background: dragging ? "rgba(0,35,102,0.03)" : "white",
        }}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />

        {state === "uploading" ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-navy)" }} />
            <p className="text-sm text-gray-500">Uploading…</p>
          </div>
        ) : state === "success" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle size={28} style={{ color: "var(--color-success)" }} />
            <p className="text-sm" style={{ color: "var(--color-success)" }}>{message}</p>
          </div>
        ) : state === "error" ? (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle size={28} style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>{message}</p>
            <p className="text-xs text-gray-400">Click to try again</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} style={{ color: "var(--color-navy)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>
              Drop a file here or click to browse
            </p>
            <p className="text-xs text-gray-400">PDF, Excel, Word, CSV — up to 25 MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
