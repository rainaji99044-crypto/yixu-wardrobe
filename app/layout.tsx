import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "衣序 · 智能衣橱",
  description: "收藏每一件喜欢，穿出每一天的自己。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

