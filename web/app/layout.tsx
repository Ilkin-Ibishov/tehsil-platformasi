import type { Metadata } from "next";
import { Golos_Text, Nunito, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { getThemeVars } from "@/lib/design-tokens";
import { TelemetryInit } from "@/components/TelemetryInit";
import { ThemeToneSync } from "@/components/ThemeToneSync";

const golosText = Golos_Text({ variable: "--font-golos", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Təhsil Platforması",
  description: "Riyaziyyat məsələsini addım-addım açan köməkçi",
};

// Defolt dark/yetkin; klient `ThemeToneSync` profil `visualTone`-u (genc/yetkin) tətbiq edir.
const themeVars = getThemeVars("dark", "yetkin");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az" data-theme="dark" data-tone="yetkin" style={themeVars as React.CSSProperties} className={`${golosText.variable} ${nunito.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="app-shell">
          <NextIntlClientProvider>
            <TelemetryInit />
            <ThemeToneSync />
            {children}
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
