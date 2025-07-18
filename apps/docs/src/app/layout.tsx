import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SecurityProvider } from "@/components/providers/security-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "next-unified-query - Type-safe data fetching for Next.js",
  description: "A powerful TypeScript library that provides unified query management, automatic caching, and seamless integration with Next.js applications.",
  keywords: ["next.js", "react", "typescript", "data fetching", "query", "cache"],
  authors: [{ name: "next-unified-query team" }],
  openGraph: {
    title: "next-unified-query - Type-safe data fetching for Next.js",
    description: "A powerful TypeScript library that provides unified query management, automatic caching, and seamless integration with Next.js applications.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "next-unified-query",
    description: "Type-safe data fetching for Next.js",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SecurityProvider>
          {children}
        </SecurityProvider>
      </body>
    </html>
  );
}
