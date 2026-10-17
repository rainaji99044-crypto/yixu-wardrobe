import type { Metadata } from "next";
import "./globals.css";
import {PwaRegister} from '@/components/pwa-register';

export const metadata: Metadata = {
  title: "衣序 · 智能衣橱",
  description: "收藏每一件喜欢，穿出每一天的自己。",
  manifest: "/manifest.webmanifest",
  applicationName: "衣序 · 智能衣橱",
  appleWebApp: {capable:true,title:"衣序",statusBarStyle:"default"},
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
      <body className="antialiased"><PwaRegister/>{children}</body>
    </html>
  );
}

