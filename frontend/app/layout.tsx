import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocChat — AI Document Intelligence",
  description: "Upload PDFs and Word docs, ask questions powered by Groq AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
