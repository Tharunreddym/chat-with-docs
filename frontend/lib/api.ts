import { ChatHistoryMessage, Document, SourceChunk, StreamCallbacks } from "./types";

const BASE = "/api";

// ── Documents ──────────────────────────────────────────────────────────────────

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/documents/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<Document[]> {
  const res = await fetch(`${BASE}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  const data = await res.json();
  return data.documents;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

// ── Chat (SSE streaming) ───────────────────────────────────────────────────────

export async function streamChat(
    messages: ChatHistoryMessage[],
    documentIds: string[] | null,
    callbacks: StreamCallbacks
): Promise<void> {
  let res: Response;

  try {
    res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, document_ids: documentIds }),
    });
  } catch (err: unknown) {
    callbacks.onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Chat request failed" }));
    callbacks.onError(err.detail ?? "Chat request failed");
    return;
  }

  if (!res.body) {
    callbacks.onError("No response body");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotResponse = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          processLine(buffer.trim(), callbacks);
        }
        if (!gotResponse) {
          callbacks.onError("No response received from model");
        } else {
          callbacks.onDone();
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split on double newline (SSE event boundary)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line) continue;

        const result = processLine(line, callbacks);
        if (result === "done") return;
        if (result === "got_data") gotResponse = true;
      }
    }
  } catch (err: unknown) {
    callbacks.onError(err instanceof Error ? err.message : "Stream read error");
  } finally {
    reader.releaseLock();
  }
}

function processLine(
    line: string,
    callbacks: StreamCallbacks
): "done" | "got_data" | "skip" {
  // Strip "data: " prefix
  const dataLine = line.startsWith("data: ") ? line.slice(6) : line;
  if (!dataLine.trim()) return "skip";

  try {
    const event = JSON.parse(dataLine);

    switch (event.type) {
      case "token":
        if (event.content) {
          callbacks.onToken(event.content);
          return "got_data";
        }
        break;
      case "sources":
        callbacks.onSources((event.sources ?? []) as SourceChunk[]);
        return "got_data";
      case "done":
        callbacks.onDone();
        return "done";
      case "error":
        callbacks.onError(event.error ?? "Unknown error");
        return "done";
    }
  } catch {
    // Not valid JSON, skip
  }

  return "skip";
}