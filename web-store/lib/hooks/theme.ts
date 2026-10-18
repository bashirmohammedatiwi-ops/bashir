"use client";
import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "dh-theme";

const apply = (pref: ThemePref) => {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#16111F" : "#8A55C9");
  return dark;
};

/** الوضع الليلي: يتبع الجهاز افتراضياً، ويُحفظ اختيار الزبونة. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let p: ThemePref = "system";
    try {
      p = (localStorage.getItem(KEY) as ThemePref) || "system";
    } catch {}
    setPref(p);
    setDark(apply(p));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => {
      let cur: ThemePref = "system";
      try {
        cur = (localStorage.getItem(KEY) as ThemePref) || "system";
      } catch {}
      if (cur === "system") setDark(apply("system"));
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const set = (p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {}
    setPref(p);
    setDark(apply(p));
  };
  return { pref, dark, set, toggle: () => set(dark ? "light" : "dark") };
}
