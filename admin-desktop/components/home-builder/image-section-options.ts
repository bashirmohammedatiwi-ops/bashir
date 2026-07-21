/** خيارات مشتركة لأقسام الصور — MEDIA_GALLERY / PHOTO_WALL / IMAGE_COLLAGE */

export const IMAGE_DISPLAY_OPTIONS = [
  { value: "scroll", label: "تمرير يدوي أفقي", icon: "↔️" },
  { value: "carousel", label: "سلايدر مع معاينة الجانب", icon: "🎠" },
  { value: "marquee", label: "تحريك تلقائي (marquee)", icon: "🎞️" },
  { value: "grid", label: "شبكة منتظمة", icon: "▦" },
  { value: "bento", label: "شبكة bento — أحجام متنوعة", icon: "🧩" },
  { value: "mosaic", label: "فسيفساء غير متساوية", icon: "🔲" },
  { value: "stack", label: "عمود — صور كاملة العرض", icon: "☰" },
  { value: "stagger", label: "متدرج — صفوف متناوبة", icon: "📐" },
] as const;

export const IMAGE_SHAPE_OPTIONS = [
  { value: "rect", label: "مستطيل حاد", preview: "▬" },
  { value: "rounded", label: "زوايا ناعمة", preview: "▢" },
  { value: "square", label: "مربع", preview: "◼" },
  { value: "circle", label: "دائرة", preview: "●" },
  { value: "pill", label: "كapsule / pill", preview: "⬭" },
  { value: "arch", label: "قوس علوي", preview: "⌒" },
  { value: "banner", label: "بانر عريض 16:9", preview: "▭" },
  { value: "portrait", label: "بورتrait عمودي", preview: "▮" },
  { value: "landscape", label: "أفقي landscape", preview: "▬" },
  { value: "diamond", label: "معيّن / Diamond", preview: "◆" },
] as const;

export const IMAGE_ASPECT_OPTIONS = [
  { value: "auto", label: "تلقائي من الشكل", ratio: null },
  { value: "1:1", label: "مربع 1:1", ratio: 1 },
  { value: "4:3", label: "كلاسيكي 4:3", ratio: 4 / 3 },
  { value: "3:4", label: "عمودي 3:4", ratio: 3 / 4 },
  { value: "16:9", label: "سينمائي 16:9", ratio: 16 / 9 },
  { value: "9:16", label: "ستوری 9:16", ratio: 9 / 16 },
  { value: "2:1", label: "بانر 2:1", ratio: 2 },
  { value: "3:2", label: "صورة 3:2", ratio: 3 / 2 },
  { value: "4:5", label: "إنستغرام 4:5", ratio: 4 / 5 },
  { value: "5:4", label: "أفقي 5:4", ratio: 5 / 4 },
  { value: "21:9", label: "Ultra-wide 21:9", ratio: 21 / 9 },
  { value: "custom", label: "مخصص (عرض × ارتفاع)", ratio: null },
] as const;

export const IMAGE_SIZE_OPTIONS = [
  { value: "xs", label: "صغير جداً (72px)", height: 72 },
  { value: "sm", label: "صغير (96px)", height: 96 },
  { value: "md", label: "متوسط (128px)", height: 128 },
  { value: "lg", label: "كبير (160px)", height: 160 },
  { value: "xl", label: "كبير جداً (200px)", height: 200 },
  { value: "2xl", label: "ضخم (260px)", height: 260 },
  { value: "full", label: "كامل عرض الشاشة", height: 220 },
] as const;

export const IMAGE_FIT_OPTIONS = [
  { value: "cover", label: "قص لملء الإطار (cover)" },
  { value: "contain", label: "عرض كامل بدون قص (contain)" },
  { value: "fill", label: "تمديد (fill)" },
] as const;

export const IMAGE_OVERLAY_OPTIONS = [
  { value: "none", label: "بدون طبقة" },
  { value: "gradient", label: "تدرج أسفل الصورة" },
  { value: "bottom", label: "شريط نص سفلي" },
  { value: "center", label: "نص في الوسط" },
  { value: "badge", label: "شارة فقط" },
] as const;

export const IMAGE_BORDER_OPTIONS = [
  { value: "none", label: "بدون إطار" },
  { value: "thin", label: "رفيع" },
  { value: "medium", label: "متوسط" },
  { value: "thick", label: "سميك" },
  { value: "accent", label: "لون مميز" },
] as const;

export function aspectRatioNumber(value?: string | null): number | null {
  if (!value || value === "auto" || value === "custom") return null;
  const found = IMAGE_ASPECT_OPTIONS.find((o) => o.value === value);
  return found?.ratio ?? null;
}

export function defaultHeightForSize(size?: string | null): number {
  return IMAGE_SIZE_OPTIONS.find((o) => o.value === size)?.height ?? 128;
}
