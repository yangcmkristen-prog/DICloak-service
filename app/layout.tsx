import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DICloak 客服助手",
  description: "用于客服团队快速生成专业回复的内部工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
