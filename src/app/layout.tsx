import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import OfflineIndicator from "@/components/OfflineIndicator";
import SubscribeForm from "@/components/SubscribeForm";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: { default: "AgeOfAI — The weekly map of technology", template: "%s — AgeOfAI" },
  description: "A weekly, domain-by-domain technology magazine with a permanent searchable archive and saved stories.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Archivo+Narrow:wght@400;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="font-body-md bg-surface selection:bg-primary selection:text-on-primary min-h-screen flex flex-col justify-between">
        <OfflineIndicator />
        <SiteChrome navigation={<Navbar />} footer={<footer className="w-full max-w-screen-2xl mx-auto px-edge-margin py-8 border-t-2 border-double border-outline-variant mt-16 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-headline-xl text-lg font-bold text-primary mb-1">AgeOfAI</h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                The weekly map of technology: source-checked editions, permanent domain archives, and stories you can save for later.
              </p>
            </div>
            <div>
              <SubscribeForm />
            </div>
          </div>
        </footer>}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
