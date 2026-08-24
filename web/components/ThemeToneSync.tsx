"use client";

import { useEffect } from "react";
import { getThemeVars, type Tone } from "@/lib/design-tokens";
import { getStoredProfile } from "@/lib/profile/storage";

export function applyVisualToneFromProfile(): void {
  if (typeof document === "undefined") return;
  const profile = getStoredProfile();
  const tone: Tone = profile.visualTone === "genc" ? "genc" : "yetkin";
  const vars = getThemeVars("dark", tone);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.tone = tone;
}

/** Applies visual tone (genc/yetkin) from local profile onto <html> CSS vars. */
export function ThemeToneSync() {
  useEffect(() => {
    applyVisualToneFromProfile();
  }, []);

  return null;
}
