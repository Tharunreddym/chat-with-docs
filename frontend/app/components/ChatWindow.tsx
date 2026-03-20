"use client";
import { useEffect, useRef, useState } from "react";
import { Message, SourceChunk } from "@/lib/types";
import { streamChat } from "@/lib/api";
import MessageBubble from "./MessageBubble";

interface Props { selectedDocIds: string[]; hasDocuments: boolean; }

const SUGGESTIONS = ["Summarize this document", "What are the key findings?", "List the main recommendations", "What conclusions are drawn?"];

export default function ChatWindow({ selectedDocIds, hasDocuments }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 130) + "px"; }
  }, [input]);

  const handleSubmit = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || isStreaming || !hasDocuments) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
    const aid = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: aid, role: "assistant", content: "", sources: [], streaming: true };
    setMessages((p) => [...p, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    try {
      await streamChat(history, selectedDocIds.length > 0 ? selectedDocIds : null, {
        onToken: (t) => setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: m.content + t } : m)),
        onSources: (s: SourceChunk[]) => setMessages((p) => p.map((m) => m.id === aid ? { ...m, sources: s } : m)),
        onDone: () => { setMessages((p) => p.map((m) => m.id === aid ? { ...m, streaming: false } : m)); setIsStreaming(false); },
        onError: (e) => { setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: e, streaming: false, error: true } : m)); setIsStreaming(false); },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setMessages((p) => p.map((m) => m.id === aid ? { ...m, content: msg, streaming: false, error: true } : m));
      setIsStreaming(false);
    }
  };

  const canSend = input.trim().length > 0 && !isStreaming && hasDocuments;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-base)", position: "relative" }}>
      {/* Top bar */}
      <div style={{ padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", background: "rgba(12,12,22,0.8)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selectedDocIds.length > 0 ? "var(--success)" : "var(--text-muted)", boxShadow: selectedDocIds.length > 0 ? "0 0 8px var(--success)" : "none", transition: "all 0.3s" }} />
          <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            {selectedDocIds.length === 0 ? "Select documents from sidebar" : `Searching ${selectedDocIds.length} document${selectedDocIds.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "1px solid var(--border-subtle)", cursor: "pointer", padding: "5px 12px", borderRadius: "99px", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >Clear</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "99px", background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="var(--accent-1)" strokeWidth="1"/><path d="M5 3v2l1.5 1.5" stroke="var(--accent-1)" strokeWidth="1" strokeLinecap="round"/></svg>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Groq · llama-3.1</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }} className="scrollbar-thin">
        {messages.length === 0 ? (
          <EmptyState hasDocuments={hasDocuments} onSuggestion={(q) => handleSubmit(q)} />
        ) : (
          <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "28px" }}>
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 20px", borderTop: "1px solid var(--border-subtle)", background: "rgba(12,12,22,0.9)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "18px", padding: "10px 10px 10px 18px", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(167,139,250,0.4)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(167,139,250,0.07)"; }}
            onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={hasDocuments ? "Ask anything about your documents…" : "Upload a document to begin…"}
              disabled={!hasDocuments || isStreaming} rows={1}
              style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.6", fontFamily: "Inter, system-ui, sans-serif", minHeight: "24px", maxHeight: "130px", opacity: (!hasDocuments || isStreaming) ? 0.45 : 1 }}
            />
            <button onClick={() => handleSubmit()} disabled={!canSend}
              style={{ width: "38px", height: "38px", borderRadius: "12px", flexShrink: 0, background: canSend ? "linear-gradient(135deg, #8b5cf6, #6366f1)" : "var(--bg-glass)", border: `1px solid ${canSend ? "transparent" : "var(--border-subtle)"}`, cursor: canSend ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: canSend ? "white" : "var(--text-muted)", transition: "all 0.2s", boxShadow: canSend ? "0 4px 14px rgba(139,92,246,0.35)" : "none", fontFamily: "inherit" }}
              onMouseEnter={e => canSend && ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)")}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
              onMouseDown={e => canSend && ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)")}
              onMouseUp={e => canSend && ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 8L2.5 2.5l2 5.5-2 5.5L13.5 8z" fill="currentColor"/></svg>
            </button>
          </div>
          <p style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: "var(--text-muted)" }}>
            Enter to send · Shift+Enter for new line · answers grounded in your documents
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasDocuments, onSuggestion }: { hasDocuments: boolean; onSuggestion: (q: string) => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "100%", textAlign: "center" }}>
      {/* Icon */}
      <div style={{ position: "relative", marginBottom: "28px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(139,92,246,0.1), transparent)", pointerEvents: "none" }} />
          {hasDocuments ? (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M6 10h24M6 16h18M6 22h12" stroke="url(#g1)" strokeWidth="2.5" strokeLinecap="round"/>
              <defs><linearGradient id="g1" x1="6" y1="10" x2="30" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#818cf8"/></linearGradient></defs>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M10 8h10l6 6v14a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z" stroke="#4a4870" strokeWidth="1.8"/>
              <path d="M20 8v6h6" stroke="#4a4870" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M18 19v6M15 22h6" stroke="#4a4870" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        {hasDocuments && <div style={{ position: "absolute", inset: "-8px", borderRadius: "32px", background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />}
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "10px" }}>
        {hasDocuments ? (
          <span className="shimmer-text">Ready to answer</span>
        ) : "Upload a document"}
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: "1.65", marginBottom: "32px" }}>
        {hasDocuments
          ? "Ask any question — I'll search your documents and reply with inline citations showing exactly where each answer comes from."
          : "Upload a PDF or Word document from the sidebar. I'll read it and answer any question you have."}
      </p>

      {hasDocuments && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "380px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>Try asking</p>
          {SUGGESTIONS.map((q) => (
            <button key={q} onClick={() => onSuggestion(q)}
              style={{ padding: "11px 16px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(167,139,250,0.3)"; b.style.color = "var(--text-primary)"; b.style.background = "rgba(167,139,250,0.06)"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--border-subtle)"; b.style.color = "var(--text-secondary)"; b.style.background = "var(--bg-elevated)"; }}
            >
              {q}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
