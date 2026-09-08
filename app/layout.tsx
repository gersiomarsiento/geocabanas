import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ACTIVE_THEME } from "@/lib/site/theme";
import { getContactSettings } from "@/lib/site/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { businessName } = await getContactSettings();
  const title = businessName ?? "Cabañas";

  return {
    title,
    description: title,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("X-NEXT-INTL-LOCALE") ?? "es";

  return (
    <html
      lang={locale}
      data-theme={ACTIVE_THEME}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Geo Cabañas" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
