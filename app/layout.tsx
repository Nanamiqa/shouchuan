import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const configuredUrl = process.env.PUBLIC_SITE_URL?.trim();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const directHost = requestHeaders.get("host")?.trim() ?? "localhost:3000";
  const hostedDomain = [forwardedHost, directHost].find((host) =>
    host === "nanamiqa.github.io" || host?.endsWith(".chatgpt.site"),
  );
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(directHost);

  let baseUrl = new URL(localHost ? `http://${directHost}` : "https://nanamiqa.github.io/shouchuan/");
  if (hostedDomain) baseUrl = new URL(`https://${hostedDomain}`);
  if (configuredUrl) {
    try {
      const candidate = new URL(configuredUrl);
      if (candidate.protocol === "http:" || candidate.protocol === "https:") baseUrl = candidate;
    } catch {
      // Keep the safe inferred origin when the optional value is malformed.
    }
  }

  return {
    metadataBase: baseUrl,
    title: {
      default: "腕间 · AI 配饰设计与手串试戴",
      template: "%s · 腕间",
    },
    description: "上传实物珠子与配件，生成手串、手机链、项链设计；也可以上传腕部照片试戴和自由串珠。",
    openGraph: {
      title: "腕间 · AI 实物创作",
      description: "上传实物素材，生成手串、手机链与项链设计。",
      type: "website",
      images: [{ url: "/og.png", width: 1731, height: 908, alt: "腕间 AI 实物创作工具" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "腕间 · AI 实物创作",
      description: "上传实物素材，生成手串、手机链与项链设计。",
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
