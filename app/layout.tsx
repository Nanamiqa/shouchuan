import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);

  return {
    metadataBase: baseUrl,
    title: {
      default: "腕间 · 手串试戴",
      template: "%s · 腕间",
    },
    description: "不用想象，戴上再决定。照片仅在你的设备上处理。",
    openGraph: {
      title: "腕间 · 手串试戴",
      description: "上传腕部照片，看看不同手串戴在自己手上的效果。",
      type: "website",
      images: [{ url: "/og.png", width: 1733, height: 909, alt: "腕间手串试戴工具" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "腕间 · 手串试戴",
      description: "不用想象，戴上再决定。",
      images: ["/og.png"],
    },
  };
}

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
