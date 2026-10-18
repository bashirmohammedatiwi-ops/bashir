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

/** نسخة الوضع الليلي من ألوان العالم: خلفيات داكنة بلمسة من لون العالم ونص فاتح. */
export function worldVarsDark(w?: Pick<World, "accentColor"> | null): Record<string, string> {
  const accent = hex(w?.accentColor, "#9B6BD8");
  const white: RGB = [255, 255, 255];
  const canvas = lerp([17, 13, 24], accent, 0.07);
  const surface = lerp([28, 22, 38], accent, 0.08);
  const ink: RGB = [244, 239, 250];
  const bright = lerp(accent, white, 0.18);
  return {
    "--accent": css(bright),
    "--accent-dark": css(lerp(accent, white, 0.08)),
    "--accent-soft": css(blend(accent, 0.24, canvas)),
    "--accent-light": css(blend(accent, 0.16, surface)),
    "--canvas": css(canvas),
    "--canvas-warm": css(lerp(canvas, accent, 0.1)),
    "--ink": css(ink),
    "--ink-soft": css(lerp(ink, canvas, 0.25)),
    "--ink-muted": css(lerp(ink, canvas, 0.48)),
    "--surface": css(surface),
    "--hairline": css(lerp(surface, ink, 0.12)),
    "--on-accent": css(white),
  };
}

const block = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");

/** CSS الألوان للعالم الحالي: الفاتح افتراضياً، والليلي حين data-theme="dark". */
export function themeCss(w?: Pick<World, "accentColor" | "canvasColor" | "inkColor" | "surfaceColor"> | null) {
  return `:root{${block(worldVars(w))};color-scheme:light}:root[data-theme="dark"]{${block(worldVarsDark(w))};color-scheme:dark}`;
}
