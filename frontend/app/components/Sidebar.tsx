"use client";
import { useRef, useState } from "react";
import { uploadDocument, deleteDocument } from "@/lib/api";
import { Document } from "@/lib/types";

interface Props {
  documents: Document[];
  selectedDocIds: string[];
  onDocumentUploaded: (doc: Document) => void;
  onDocumentDeleted: (id: string) => void;
  onToggleDoc: (id: string) => void;
}

export default function Sidebar({ documents, selectedDocIds, onDocumentUploaded, onDocumentDeleted, onToggleDoc }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      onDocumentUploaded(doc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { await handleUpload(file); }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteDocument(id); onDocumentDeleted(id); }
    catch { setError("Delete failed."); }
  };

  return (
    <aside style={{ width: "270px", minWidth: "270px", display: "flex", flexDirection: "column", height: "100%", borderRight: "1px solid var(--border-subtle)", background: "var(--bg-surface)", position: "relative", overflow: "hidden" }}>
      {/* Subtle top gradient line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)" }} />

      {/* Logo */}
      <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ position: "relative", width: "36px", height: "36px", flexShrink: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4.5C3 3.12 4.12 2 5.5 2h7C13.88 2 15 3.12 15 4.5v9c0 1.38-1.12 2.5-2.5 2.5h-7A2.5 2.5 0 013 13.5v-9z" stroke="#a78bfa" strokeWidth="1.2"/>
                <path d="M6 6.5h6M6 9h4.5M6 11.5h5" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="shimmer-text" style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>DocChat</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>AI Document Intelligence</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div style={{ padding: "14px" }}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }} onChange={handleFileChange} />
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={uploading ? "" : "pulse-ring"}
          style={{
            padding: "20px 14px", borderRadius: "14px", cursor: uploading ? "not-allowed" : "pointer",
            border: `1.5px dashed ${dragOver ? "rgba(167,139,250,0.6)" : "rgba(167,139,250,0.25)"}`,
            background: dragOver ? "rgba(167,139,250,0.08)" : "rgba(167,139,250,0.04)",
            textAlign: "center", transition: "all 0.2s",
          }}
        >
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: "spin 1s linear infinite", color: "var(--accent-1)" }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="38" strokeDashoffset="12" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Processing document…</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: "var(--accent-1)" }}>
                  <path d="M9 12V6M9 6L6.5 8.5M9 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 13.5A3 3 0 014.5 8a4 4 0 017.9-.7A3 3 0 0114 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent-1)" }}>Upload document</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>PDF or DOCX · drag & drop</p>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "12px", color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </div>

      {/* Docs */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }} className="scrollbar-thin">
        {documents.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No documents yet</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "10px 10px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Documents</p>
              <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "var(--accent-dim)", color: "var(--accent-1)", fontWeight: 600 }}>{documents.length}</span>
            </div>
            {documents.map((doc) => {
              const sel = selectedDocIds.includes(doc.id);
              return (
                <div key={doc.id} onClick={() => onToggleDoc(doc.id)} className="animate-in"
                  style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "9px 10px", borderRadius: "12px", cursor: "pointer", marginBottom: "2px", position: "relative", background: sel ? "rgba(167,139,250,0.08)" : "transparent", border: `1px solid ${sel ? "rgba(167,139,250,0.18)" : "transparent"}`, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-glass-hover)"; }}
                  onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {/* Check */}
                  <div style={{ width: "16px", height: "16px", borderRadius: "5px", marginTop: "2px", flexShrink: 0, border: `1.5px solid ${sel ? "var(--accent-1)" : "var(--border-mid)"}`, background: sel ? "var(--accent-1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                    {sel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12.5px", fontWeight: 500, color: sel ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.filename}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{doc.page_count}p · {doc.chunk_count} chunks</p>
                  </div>
                  {/* Delete */}
                  <button onClick={(e) => handleDelete(doc.id, e)} style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "7px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "all 0.15s", fontFamily: "inherit" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                    ref={el => { if (el) { const parent = el.parentElement; parent?.addEventListener("mouseenter", () => el.style.opacity = "1"); parent?.addEventListener("mouseleave", () => el.style.opacity = "0"); } }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M5 5v4M7 5v4M2.5 3l.6 6.5a1 1 0 001 .9h3.8a1 1 0 001-.9L9.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Status footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: selectedDocIds.length > 0 ? "var(--success)" : "var(--text-muted)", boxShadow: selectedDocIds.length > 0 ? "0 0 6px var(--success)" : "none", flexShrink: 0, transition: "all 0.3s" }} />
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {selectedDocIds.length === 0 ? "No docs selected" : `${selectedDocIds.length} of ${documents.length} active`}
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
}
