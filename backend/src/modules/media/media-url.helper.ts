import { BadRequestException } from "@nestjs/common";
import * as net from "net";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

const INTERNAL_FETCH_HOSTS = new Set(
  (process.env.MEDIA_INTERNAL_FETCH_HOSTS ?? "nginx,api")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

export function resolveRemoteMediaUrl(raw: string): string {
  return String(raw || "").trim();
}

export function assertSafeRemoteUrl(raw: string): string {
  const url = resolveRemoteMediaUrl(raw);
  if (!url) throw new BadRequestException("رابط الصورة غير صالح");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException("رابط الصورة غير صالح");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new BadRequestException("بروتوكول الرابط غير مدعوم");
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) {
    throw new BadRequestException("رابط الصورة غير مسموح");
  }

  const ipVersion = net.isIP(host);
  if (ipVersion === 4 && isPrivateIpv4(host) && !INTERNAL_FETCH_HOSTS.has(host)) {
    throw new BadRequestException("رابط الصورة غير مسموح");
  }

  return url;
}
