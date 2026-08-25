"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Don't show bottom nav on camera/solve screen to preserve full immersion
  if (pathname === "/kamera" || pathname === "/onboarding") return null;

  const items = [
    { href: "/", label: t("home") },
    { href: "/bank", label: t("bank") },
    { href: "/profil", label: t("report") },
    { href: "/uslub", label: t("tone") },
  ];

  return (
    <nav
      aria-label={t("aria")}
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        background: "var(--bg)",
        borderTop: "1px solid var(--bor)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        alignItems: "center",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href === "/profil" && pathname === "/hesabat");
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderTop: isActive ? "2px solid var(--acc)" : "2px solid transparent",
              marginTop: "-1px",
              color: isActive ? "var(--acc)" : "var(--t3)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textDecoration: "none",
              textTransform: "uppercase",
              transition: "color 180ms ease, border-color 180ms ease",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
