export const APP_DOMAIN = "deemaalhayat.com";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${APP_DOMAIN}`;
export const STORE_NAME = "ديما الحياة";
export const STORE_NAME_EN = "deema alhayat";
export const STORE_TAGLINE = "متجر مستحضرات التجميل والعناية الأصلية في العراق";
export const CURRENCY = "د.ع";

/** المتصفح: نفس النطاق (nginx يوجّه /api). */
export const API_PUBLIC = "/api/v1";
/** السيرفر (داخل Docker): الـ API مباشرة بلا المرور بـ nginx. */
export const API_INTERNAL = process.env.API_INTERNAL_URL ?? "http://localhost:3100/api/v1";

export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.deemaalhayat.app";
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? "";
