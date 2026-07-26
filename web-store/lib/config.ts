export const APP_DOMAIN = "deemaalhayat.com";
export const APP_ORIGIN = `https://${APP_DOMAIN}`;
export const STORE_NAME_AR = "ديما الحياة";
export const STORE_NAME_EN = "deema alhayat";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE?.replace(/\/$/, "") ?? "/media";

export function displayStoreName(lang: "ar" | "en" = "ar") {
  return lang === "ar" ? STORE_NAME_AR : STORE_NAME_EN;
}
