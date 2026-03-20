"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { Document } from "@/lib/types";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const handleDocumentUploaded = (doc: Document) => {
    setDocuments((prev) => [doc, ...prev]);
    setSelectedDocIds((prev) => [...prev, doc.id]);
  };
  const handleDocumentDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((d) => d !== id));
  };
  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", background: "var(--bg-void)" }}>
      {/* Ambient orbs */}
      <div className="orb" style={{ position: "absolute", top: "-10%", left: "15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div className="orb-2" style={{ position: "absolute", bottom: "0", right: "10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%", height: "100%" }}>
        <Sidebar documents={documents} selectedDocIds={selectedDocIds} onDocumentUploaded={handleDocumentUploaded} onDocumentDeleted={handleDocumentDeleted} onToggleDoc={toggleDocSelection} />
        <main style={{ flex: 1, overflow: "hidden" }}>
          <ChatWindow selectedDocIds={selectedDocIds} hasDocuments={documents.length > 0} />
        </main>
      </div>
    </div>
  );
}
