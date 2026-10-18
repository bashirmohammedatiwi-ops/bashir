import type { Config } from "tailwindcss";

/** ألوان العالم الحالي تأتي من متغيرات CSS (تتبدّل مع العالم المختار كما في التطبيق). */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", xl: "2rem" }, screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        accent: { DEFAULT: v("accent"), dark: v("accent-dark"), soft: v("accent-soft"), light: v("accent-light") },
        canvas: { DEFAULT: v("canvas"), warm: v("canvas-warm") },
        ink: { DEFAULT: v("ink"), soft: v("ink-soft"), muted: v("ink-muted") },
        surface: v("surface"),
        hairline: v("hairline"),
        sale: "#E0457B",
        success: "#0F8A4F",
        star: "#F5B942",
        rose: { DEFAULT: "#F0A7C4", deep: "#C0679A", soft: "#FDEAF2" },
      },
      fontFamily: { sans: ["var(--font-plex)", "system-ui", "sans-serif"] },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        card: "0 1px 2px rgb(var(--accent-dark) / 0.04), 0 8px 24px -12px rgb(var(--accent-dark) / 0.18)",
        lift: "0 18px 40px -18px rgb(var(--accent-dark) / 0.35)",
        float: "0 24px 60px -20px rgb(26 20 38 / 0.35)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(50%)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(-100%)" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.35)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        marquee: "marquee var(--marquee-speed, 30s) linear infinite",
        "fade-up": "fade-up .5s cubic-bezier(.2,.8,.2,1) both",
        shimmer: "shimmer 1.4s infinite",
        pop: "pop .45s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
