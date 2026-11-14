import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import CookieBanner from "@/components/CookieBanner";
import { pageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...pageMetadata({
    title: "Unidos de Avidos",
    description:
      "Associação Unidos de Avidos - Marchas Antoninas de Vila Nova de Famalicão desde 2005. Aluguer de roupas e fardas históricas.",
    path: "/",
  }),
  // Páginas definem só o seu título; o template acrescenta o nome da associação.
  title: { default: "Unidos de Avidos — Marchas Antoninas de Famalicão", template: "%s | Unidos de Avidos" },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <main className="flex-1 pt-24">{children}</main>
        <ScrollToTopButton />
        <CookieBanner />
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
