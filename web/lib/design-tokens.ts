// Dizayn tokenlərinin TƏK MƏNBƏYİ docs/DESIGN-TOKENS.json-dur (ADR-002). Komponentdə rəng/
// radius hardcode etmək qadağandır — hər şey buradan CSS custom property kimi kök elementə
// yazılır, komponentlər yalnız var(--token) oxuyur.
import tokens from "../../docs/DESIGN-TOKENS.json";

export type Theme = "dark" | "light";
export type Tone = "genc" | "yetkin";

type ThemeTokens = (typeof tokens.theme)["dark"];
type ToneTokens = (typeof tokens.tone)["genc"];

const THEME_KEY_MAP: Record<keyof ThemeTokens, string> = {
  bg: "--bg",
  sur: "--sur",
  bor: "--bor",
  t1: "--t1",
  t2: "--t2",
  t3: "--t3",
  acc: "--acc",
  accSoft: "--accsoft",
  accMid: "--accmid",
  accInk: "--accink",
  warn: "--warn",
  warnSoft: "--warnsoft",
  trackEmpty: "--trackempty",
  passive: "--passive",
};

const TONE_KEY_MAP: Record<keyof ToneTokens, string> = {
  rad: "--rad",
  radSm: "--radsm",
  hFont: "--hfont",
  hWeight: "--hweight",
  hSize: "--hsize",
  tap: "--tap",
  track: "--track",
};

/** Verilən tema/ton üçün CSS custom property-lərin obyektini qaytarır — kök elementə
 * `style={getThemeVars(...)}` kimi tətbiq olunur (design/*.dc.html-dəki `--bg: {{ vBg }}`
 * inline nümunəsi ilə eyni məntiq, tək fərq: dəyərlər JSON-dan gəlir, əl ilə yazılmır). */
export function getThemeVars(theme: Theme, tone: Tone): Record<string, string> {
  const themeTokens = tokens.theme[theme];
  const toneTokens = tokens.tone[tone];

  const vars: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(THEME_KEY_MAP)) {
    vars[cssVar] = themeTokens[key as keyof ThemeTokens];
  }
  for (const [key, cssVar] of Object.entries(TONE_KEY_MAP)) {
    vars[cssVar] = toneTokens[key as keyof ToneTokens];
  }
  vars["--font-body"] = tokens.font.body;
  vars["--font-mono"] = tokens.font.mono;
  vars["--max-width"] = tokens.layout.maxWidth;
  vars["--page-pad-x"] = tokens.layout.pagePadX;

  return vars;
}

export const FONT_LOAD_URL = tokens.font._load;
export const designTokens = tokens;
