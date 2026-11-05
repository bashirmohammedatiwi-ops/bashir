"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** المسافة (بالبكسل) فوق الشاشة وتحتها التي يُركَّب فيها القسم. */
const NEAR = 1400;

/**
 * يركّب القسم فقط حين يقترب من الشاشة، ويفكّه حين يبتعد كثيراً مع إبقاء ارتفاعه (فلا تقفز الصفحة).
 * الرئيسية فيها ~240 منتجاً و~350 صورة: بدونه يبني Safari كل شيء دفعة واحدة (iOS 13–15.3 لا يدعم
 * loading="lazy" فيحمّل كل الصور فوراً) وتتراكم الذاكرة مع التمرير حتى يُغلق iPhone الصفحة أو تتجمّد.
 */
export function Deferred({ children, estimate = 420 }: { children: ReactNode; estimate?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShow(true);
        else {
          // نحفظ الارتفاع الحقيقي قبل الفك حتى يبقى مكانه محجوزاً.
          const h = el.getBoundingClientRect().height;
          if (h > 0) setHeight(h);
          setShow(false);
        }
      },
      { rootMargin: `${NEAR}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={show ? undefined : { minHeight: height ?? estimate }}>
      {show ? children : null}
    </div>
  );
}
