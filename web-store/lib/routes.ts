/** Privacy / terms pages (AR + EN) — no app-store CTAs while stores are pending. */
export function isLegalRoute(pathname: string): boolean {
  return /^\/(en\/)?(privacy|terms)\/?$/.test(pathname);
}
