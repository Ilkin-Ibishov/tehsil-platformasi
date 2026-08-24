"use client";

import { type ReactElement } from "react";

type MathKeyboardBarProps = {
  onInsert: (symbol: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
};

const MATH_CHIPS = [
  { label: "√", symbol: "√", title: "Kök" },
  { label: "/", symbol: "/", title: "Kəsr / Bölmə" },
  { label: "x²", symbol: "²", title: "Kvadrat" },
  { label: "x³", symbol: "³", title: "Kub" },
  { label: "π", symbol: "π", title: "Pi" },
  { label: "±", symbol: "±", title: "Müsbət / Mənfi" },
  { label: "−", symbol: "-", title: "Mənfi" },
  { label: ".", symbol: ".", title: "Nöqtə" },
] as const;

export function MathKeyboardBar({
  onInsert,
  onBackspace,
  onClear,
  disabled = false,
}: MathKeyboardBarProps): ReactElement {
  return (
    <div
      role="toolbar"
      aria-label="Riyazi simvollar"
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
          title={chip.title}
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
            minHeight: 40,
            minWidth: 40,
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
        title="Sil"
        aria-label="Sil"
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
          minHeight: 40,
          minWidth: 40,
          padding: "0 10px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--bor)",
          borderRadius: "var(--rad)",
          background: "var(--sur)",
          color: "var(--warn, #e53e3e)",
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
        title="Hamısını təmizlə"
        aria-label="Hamısını təmizlə"
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
          minHeight: 40,
          minWidth: 36,
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
