import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import InstallPrompt from "@/components/features/InstallPrompt";

export const metadata: Metadata = {
  title: "青马工程学生干部素质拓展活动 | 大连交通大学机械工程学院",
  description: "大连交通大学机械工程学院团委青马工程学生干部素质拓展活动官方网站",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "青马工程",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="青马工程" />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
