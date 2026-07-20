/** أحجام البطاقات — يُستخدم في الـ resolver والتطبيق */
export type CardSizeId = "xs" | "sm" | "md" | "lg" | "xl" | "wide" | "tall" | "hero";

export {
  CARD_SIZE_DIMS,
  resolveCardSize,
  withCardSize,
  sectionStyleFromPayload,
  resolveAdSlotFromPayload,
  bannerAspectForSize,
} from "./ad-slots.util";
