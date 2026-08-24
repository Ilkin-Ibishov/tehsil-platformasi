---
name: ux-audit
description: >-
  Audits Web UI components and mobile screens against design specifications (design/*.dc.html) and design tokens (docs/DESIGN-TOKENS.json). Use when reviewing, modifying, or creating UI elements.
---

# UX & Design Audit

Ensures that UI changes remain true to the 9 approved interactive HTML mockups (`design/*.dc.html`) and single-source design tokens.

## Audit Checklist

1. **Design Tokens Compliance**:
   - Check that no hex codes (`#10B981`, `#0F172A`) or raw pixel sizes are hardcoded in React components.
   - Use CSS custom variables generated via `docs/DESIGN-TOKENS.json` (`var(--color-primary)`, `var(--radius-md)`, etc.).
2. **Mobile Constraints**:
   - Root layout container must maintain `max-width: 480px` centered on viewport.
3. **i18n & Copy**:
   - All text rendered on screen must use `useTranslations()` from `next-intl` reading `web/messages/az.json`.
4. **Step-by-Step Flow**:
   - The UI must never skip step recording or error tracking. The core value of the product is capturing the student's exact misconception (`error_code`).
