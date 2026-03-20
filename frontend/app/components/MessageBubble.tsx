"use client";
import { Message } from "@/lib/types";

interface Props { message: Message; }

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "5px" }}>
      <p style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", paddingLeft: isUser ? 0 : "4px", paddingRight: isUser ? "4px" : 0 }}>
        {isUser ? "You" : "DocChat AI"}
      </p>
      <div style={{
        maxWidth: "80%", padding: "13px 17px",
        borderRadius: isUser ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
        background: isUser
          ? "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))"
          : "var(--bg-elevated)",
        border: `1px solid ${isUser ? "rgba(167,139,250,0.22)" : "var(--border-subtle)"}`,
        fontSize: "14px", lineHeight: "1.7",
        color: message.error ? "var(--danger)" : "var(--text-primary)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        position: "relative",
      }}>
        {isUser && <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "linear-gradient(135deg, rgba(255,255,255,0.04), transparent)", pointerEvents: "none" }} />}
        <span className={message.streaming && !message.content ? "streaming-cursor" : ""}>
          {message.content || (message.streaming ? "" : "…")}
        </span>
        {message.streaming && message.content && <span className="streaming-cursor" />}
      </div>

      {/* Sources */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxWidth: "80%", paddingLeft: "4px", marginTop: "2px" }}>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px", marginRight: "2px" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 2a1 1 0 011-1h4l2.5 2.5V8a1 1 0 01-1 1H2a1 1 0 01-1-1V2z" stroke="currentColor" strokeWidth="0.9"/><path d="M2.5 4.5h5M2.5 6h3.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
            Sources
          </span>
          {message.sources.map((src, i) => (
            <div key={i} className="source-chip" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px 3px 8px", borderRadius: "99px", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)", fontSize: "11px", color: "var(--accent-1)", cursor: "default", fontWeight: 500, whiteSpace: "nowrap" }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1.5A.5.5 0 011.5 1h4L7.5 3.5V7.5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-6z" stroke="currentColor" strokeWidth="0.8"/></svg>
              {src.filename.length > 16 ? src.filename.slice(0, 16) + "…" : src.filename}
              <span style={{ color: "rgba(167,139,250,0.5)", fontSize: "10px" }}>p.{src.page}</span>
              {/* Tooltip */}
              <div className="source-tooltip" style={{ position: "absolute", bottom: "calc(100% + 10px)", left: "0", width: "240px", padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "14px", zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.1)" }}>
                <div style={{ position: "absolute", bottom: "-5px", left: "16px", width: "10px", height: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderTop: "none", borderLeft: "none", transform: "rotate(45deg)" }} />
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-1)", marginBottom: "6px" }}>{src.filename} · p.{src.page}</p>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.55", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{src.text_preview}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
