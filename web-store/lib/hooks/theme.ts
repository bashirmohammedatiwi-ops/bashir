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

/** الوضع الفاتح افتراضياً؛ الليلي أو «حسب الجهاز» فقط إن اختارته الزبونة (ويُحفظ اختيارها). */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("light");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let p: ThemePref = "light";
    try {
      p = (localStorage.getItem(KEY) as ThemePref) || "light";
    } catch {}
    setPref(p);
    setDark(apply(p));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => {
      let cur: ThemePref = "light";
      try {
        cur = (localStorage.getItem(KEY) as ThemePref) || "light";
      } catch {}
      if (cur === "system") setDark(apply("system"));
    };
    // آيفون iOS 13 وأقدم: لا addEventListener على MediaQueryList (كان يرمي خطأً يُسقط كل الصفحات).
    if (mq.addEventListener) mq.addEventListener("change", on);
    else mq.addListener?.(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener?.(on));
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
