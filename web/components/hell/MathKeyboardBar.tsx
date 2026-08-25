"use client";

import { type ReactElement } from "react";
import { useTranslations } from "next-intl";

type MathKeyboardBarProps = {
  onInsert: (symbol: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function MathKeyboardBar({
  onInsert,
  onBackspace,
  onClear,
  disabled = false,
}: MathKeyboardBarProps): ReactElement {
  const t = useTranslations("mathKeyboard");

  const MATH_CHIPS = [
    { label: "√", symbol: "√", titleKey: "root" as const },
    { label: "/", symbol: "/", titleKey: "fraction" as const },
    { label: "x²", symbol: "²", titleKey: "square" as const },
    { label: "x³", symbol: "³", titleKey: "cube" as const },
    { label: "π", symbol: "π", titleKey: "pi" as const },
    { label: "±", symbol: "±", titleKey: "plusMinus" as const },
    { label: "−", symbol: "-", titleKey: "minus" as const },
    { label: ".", symbol: ".", titleKey: "dot" as const },
  ];

  return (
    <div
      role="toolbar"
      aria-label={t("toolbar")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "4px 0",
        scrollbarWidth: "none",
        touchAction: "manipulation",
      }}
    >
      {MATH_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          disabled={disabled}
          title={t(chip.titleKey)}
          // e.preventDefault() prevents the input from losing focus / mobile keyboard hiding
          onMouseDown={(e) => {
            e.preventDefault();
            onInsert(chip.symbol);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            onInsert(chip.symbol);
          }}
          style={{
            flexShrink: 0,
            minHeight: 44,
            minWidth: 44,
            padding: "0 10px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--bor)",
            borderRadius: "var(--rad)",
            background: "var(--sur)",
            color: "var(--t1)",
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            transition: "background 150ms ease, border-color 150ms ease",
          }}
        >
          {chip.label}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled}
        title={t("backspace")}
        aria-label={t("backspace")}
        onMouseDown={(e) => {
          e.preventDefault();
          onBackspace();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          onBackspace();
        }}
        style={{
          flexShrink: 0,
          minHeight: 44,
          minWidth: 44,
          padding: "0 10px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
          color: "var(--warn)",
          fontFamily: "var(--font-mono)",
          fontSize: 16,
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        ⌫
      </button>

      <button
        type="button"
        disabled={disabled}
        title={t("clear")}
        aria-label={t("clear")}
        onMouseDown={(e) => {
          e.preventDefault();
          onClear();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          onClear();
        }}
        style={{
          flexShrink: 0,
          minHeight: 44,
          minWidth: 44,
          padding: "0 8px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
          color: "var(--t3)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        C
      </button>
    </div>
  );
}
