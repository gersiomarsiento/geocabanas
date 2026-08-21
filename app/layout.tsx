import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "./components/CurrencyProvider";
import { ACTIVE_THEME } from "../lib/site/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GEOCABAÑAS - Punta del Diablo",
  description: "GEOCABAÑAS - Punta del Diablo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme={ACTIVE_THEME}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {" "}
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}