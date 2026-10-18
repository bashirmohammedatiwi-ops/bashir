import type { World } from "./types";

type RGB = [number, number, number];
const hex = (h?: string | null, fallback = "#9B6BD8"): RGB => {
  const s = (h ?? fallback).replace("#", "").trim();
  const v = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s.slice(0, 6), 16);
  if (Number.isNaN(v)) return hex(fallback);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const lerp = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
const blend = (top: RGB, alpha: number, base: RGB): RGB => lerp(base, top, alpha);
const css = (c: RGB) => c.join(" ");

/** ألوان العالم ← متغيرات CSS (نفس معادلات التطبيق). */
export function worldVars(w?: Pick<World, "accentColor" | "canvasColor" | "inkColor" | "surfaceColor"> | null): Record<string, string> {
  const accent = hex(w?.accentColor, "#9B6BD8");
  const canvas = hex(w?.canvasColor, "#F8F6FB");
  const ink = hex(w?.inkColor, "#1A1426");
  const surface = hex(w?.surfaceColor, "#FFFFFF");
  const white: RGB = [255, 255, 255];
  const black: RGB = [0, 0, 0];
  return {
    "--accent": css(accent),
    "--accent-dark": css(lerp(accent, black, 0.22)),
    "--accent-soft": css(blend(accent, 0.14, canvas)),
    "--accent-light": css(blend(accent, 0.08, surface)),
    "--canvas": css(canvas),
    "--canvas-warm": css(lerp(canvas, accent, 0.06)),
    "--ink": css(ink),
    "--ink-soft": css(lerp(ink, canvas, 0.35)),
    "--ink-muted": css(lerp(ink, canvas, 0.55)),
    "--surface": css(surface),
    "--hairline": css(lerp(canvas, ink, 0.09)),
    "--on-accent": css(white),
  };
}
