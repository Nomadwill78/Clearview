"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, PhoneCall } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cited_sources?: { document_name?: string; kpi_name?: string }[];
  created_at: string;
}

export default function ChatWindow({ orgId, initialMessages }: { orgId: string; initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: json.reply, cited_sources: json.cited_sources ?? [], created_at: new Date().toISOString() };
      setMessages((m) => [...m, aiMsg]);
      if (json.suggestHandoff) setShowHandoff(true);
    } catch {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: "I encountered an error. Please try again.", created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  async function requestHandoff() {
    await fetch("/api/handoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, triggeredBy: "user_request" }) });
    setShowHandoff(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: "Your Nomad Consulting advisor has been notified. Expect to hear from someone within 1 business day. A briefing summary of your organization has been shared with them.", created_at: new Date().toISOString() }]);
  }

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-[600px]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between" style={{ background: "var(--color-navy)" }}>
        <div>
          <p className="text-white text-sm font-serif">Navigator AI</p>
          <p className="text-white/50 text-[11px]">Powered by Nomad Consulting intelligence</p>
        </div>
        <button
          onClick={() => setShowHandoff(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
        >
          <PhoneCall size={12} /> Talk to an advisor
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-sm">Ask me anything about your organization.</p>
            <p className="text-xs mt-1">Try: &quot;Why is our reserve ratio low?&quot; or &quot;What should we prioritize this quarter?&quot;</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
              style={{
                background: m.role === "user" ? "var(--color-navy)" : "var(--color-parchment-light)",
                color: m.role === "user" ? "white" : "var(--color-navy-dark)",
              }}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.cited_sources && m.cited_sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                  {m.cited_sources.map((s, i) => (
                    <p key={i} className="text-[11px] opacity-60">
                      Source: {s.document_name ?? s.kpi_name ?? "Document"}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2.5" style={{ background: "var(--color-parchment-light)" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-navy)" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Handoff banner */}
      {showHandoff && (
        <div className="px-5 py-3 border-t text-sm flex items-center justify-between gap-3" style={{ background: "var(--color-parchment)", borderColor: "var(--color-parchment-dark)" }}>
          <p style={{ color: "var(--color-navy)" }}>
            Ready to go deeper? A Nomad advisor can take it from here.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowHandoff(false)} className="text-xs text-gray-500 px-2 py-1">Dismiss</button>
            <button onClick={requestHandoff} className="text-xs px-3 py-1 rounded-lg text-white" style={{ background: "var(--color-navy)" }}>
              Connect me
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about your organization…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 transition-colors"
          style={{ color: "var(--color-navy)" }}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-navy)" }}
        >
          <Send size={14} color="white" />
        </button>
      </div>
    </div>
  );
}
