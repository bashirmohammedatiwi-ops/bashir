import dayjs from "dayjs";
import { normalizePayload, SectionType } from "./section-types";

const EMPTY_LINK_KEYS = [
  "categoryId",
  "subcategoryId",
  "tertiaryCategoryId",
  "brandId",
  "linkType",
  "linkValue",
  "link",
] as const;

function deepSerialize(value: unknown): unknown {
  if (value == null) return value;
  if (dayjs.isDayjs(value)) return value.toISOString();
  if (Array.isArray(value)) return value.map(deepSerialize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const serialized = deepSerialize(nested);
      if (serialized === undefined) continue;
      out[key] = serialized;
    }
    return out;
  }
  return value;
}

function stripEmptyStrings(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === "") continue;
    if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? stripEmptyStrings(item as Record<string, unknown>)
          : item,
      );
      continue;
    }
    if (value && typeof value === "object") {
      out[key] = stripEmptyStrings(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** يحضّر payload للـ API — بدون حقول المحرّر الداخلية */
export function serializeHomeBlockPayload(
  type: SectionType,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const copy = stripEmptyStrings({ ...payload });
  delete copy.source;
  for (const key of EMPTY_LINK_KEYS) {
    if (copy[key] === "") delete copy[key];
  }
  return normalizePayload(type, deepSerialize(copy) as Record<string, unknown>);
}
