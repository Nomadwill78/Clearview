"use client";

import { useState } from "react";
import { CheckSquare, Square, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigned_role: string;
  suggested_due_date: string | null;
  status: string;
  kpi_definitions?: { name: string; domain: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#6b7280",
  in_progress: "var(--color-warning)",
  complete: "var(--color-success)",
};

export default function ActionPlan({ orgId, items, canEdit }: { orgId: string; items: ActionItem[]; canEdit: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);

  async function updateStatus(id: string, status: string) {
    setLocalItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    await fetch("/api/action-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, orgId }),
    });
  }

  const open = localItems.filter((i) => i.status !== "complete");
  const done = localItems.filter((i) => i.status === "complete");
  const pct = localItems.length > 0 ? Math.round((done.length / localItems.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="font-serif text-base" style={{ color: "var(--color-navy)" }}>Action Plan</p>
          <span className="text-xs text-gray-400">{pct}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--color-navy)" }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {localItems.length === 0 && (
          <div className="text-center text-gray-400 mt-12 text-sm">
            <p>No action items yet.</p>
            <p className="text-xs mt-1">Upload documents to generate your improvement roadmap.</p>
          </div>
        )}

        {open.map((item) => (
          <ActionItemRow
            key={item.id}
            item={item}
            canEdit={canEdit}
            expanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            onStatusChange={updateStatus}
          />
        ))}

        {done.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-2">Completed</p>
            {done.map((item) => (
              <ActionItemRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItemRow({
  item, canEdit, expanded, onToggle, onStatusChange,
}: {
  item: ActionItem;
  canEdit: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden transition-all"
      style={{ borderColor: expanded ? "var(--color-navy)" : "#e5e7eb" }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer" onClick={onToggle}>
        {canEdit ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(item.id, item.status === "complete" ? "open" : "complete");
            }}
            className="flex-shrink-0"
          >
            {item.status === "complete"
              ? <CheckSquare size={16} style={{ color: "var(--color-success)" }} />
              : <Square size={16} className="text-gray-300" />
            }
          </button>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[item.status] }} />
        )}

        <p className={`flex-1 text-sm ${item.status === "complete" ? "line-through text-gray-400" : ""}`} style={item.status !== "complete" ? { color: "var(--color-navy)" } : {}}>
          {item.title}
        </p>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.suggested_due_date && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={10} />
              {new Date(item.suggested_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed mb-2">{item.description}</p>
          <div className="flex items-center gap-3">
            {item.kpi_definitions && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {item.kpi_definitions.name}
              </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
              {item.assigned_role}
            </span>
            {canEdit && item.status !== "complete" && (
              <button
                onClick={() => onStatusChange(item.id, "in_progress")}
                className="text-[11px] px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "var(--color-navy)", color: "white" }}
              >
                Mark in progress
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
