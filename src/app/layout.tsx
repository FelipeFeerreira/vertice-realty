import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND, SITE_URL } from "@/lib/constants";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — Boutique Real Estate in São Paulo`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: BRAND.name,
    title: `${BRAND.name} — Boutique Real Estate in São Paulo`,
    description: BRAND.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
          >
            Skip to content
          </a>
          <Suspense fallback={<div className="h-[68px] border-b border-line bg-ivory lg:h-[108px]" />}>
            <Header />
          </Suspense>
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <Footer />
          <ChatWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
