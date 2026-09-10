# Web UI, Mobile Ergonomics & Design Tokens

## UI Invariants
- **Layout**: `max-width: 480px` mobile-first container. Crop cannot be skipped (real DİM booklets contain multiple questions per page).
- **Copy & Localization**: All user-facing strings must use `useTranslations(...)` from `next-intl` (`web/messages/az.json`). Never hardcode UI text.
- **Design Tokens**: Colors, borders, radiuses, and fonts must come from `docs/DESIGN-TOKENS.json` via `var(--token)`. No inline hex or arbitrary px values.
- **Specifications**: Mockups in `design/*.dc.html` are the source specification for layouts and copy.
- **Touch Targets**: All interactive elements (math buttons, navigation icons) must respect minimum 44px touch targets.
- **Math Keyboard Invariant**: The math input toolbar (`MathKeyboardBar.tsx`) must provide algebraic expression primitives (`x`, `(`, `)`) alongside arithmetic chips (`√`, `/`, `²`, etc.) to prevent mobile keyboard bouncing during step responses.
- **Empathetic Copy Invariant**: Error feedback and step diagnosis copy must be framed supportively (e.g. `"qeyd olundu, birlikdə düzəldəcəyik"`), never punitive or bureaucratic (avoid `"hesabatına yazıldı"`, `"cəza"`). Onboarding labels must be welcoming (`"TANIŞLIQ"` instead of mechanical `"QURAŞDIRMA"`).
- **Pedagogical Guard**: Skipping steps without recording an `error_code` is a product defect, not a UX shortcut.
