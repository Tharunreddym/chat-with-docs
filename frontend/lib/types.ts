export interface Document {
  id: string;
  filename: string;
  page_count: number;
  chunk_count: number;
  uploaded_at: string;
  size_bytes: number;
}

export interface SourceChunk {
  document_id: string;
  filename: string;
  page: number;
  text_preview: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  streaming?: boolean;
  error?: boolean;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources: (sources: SourceChunk[]) => void;
  onDone: () => void;
  onError: (err: string) => void;
}
