import { api } from "./api";
import {
  parseAutofill,
  parseShadeFamily,
  pickImages,
  type AiAutofillResult,
  type AiModelOption,
  type ShadeFamilyResult,
} from "./aiProductTypes";

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return (d?.data ?? data) as T;
}

export async function fetchAiModels(): Promise<{ default?: string; models: AiModelOption[] }> {
  const res = await api.get("/ai-product/models");
  const body = unwrap<Record<string, unknown>>(res.data);
  const models = ((body.models as unknown[]) ?? []).map((m) => {
    const row = m as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      labelAr: String(row.labelAr ?? row.id ?? ""),
      labelEn: String(row.labelEn ?? row.id ?? ""),
      descriptionAr: row.descriptionAr ? String(row.descriptionAr) : undefined,
      apiModel: row.apiModel ? String(row.apiModel) : undefined,
      fast: row.fast === true,
    };
  });
  return { default: body.default ? String(body.default) : undefined, models };
}

export async function aiAutofill(input: {
  barcode: string;
  hint?: string;
  model?: string;
  force?: boolean;
}): Promise<AiAutofillResult> {
  const res = await api.post(
    "/ai-product/autofill",
    {
      barcode: input.barcode.trim(),
      ...(input.hint?.trim() ? { hint: input.hint.trim() } : {}),
      ...(input.model?.trim() ? { model: input.model.trim() } : {}),
      ...(input.force ? { force: true } : {}),
    },
    { timeout: 180_000 },
  );
  return parseAutofill(unwrap(res.data));
}

export async function aiShadeFamily(input: {
  barcodes: string[];
  hint?: string;
  model?: string;
}): Promise<ShadeFamilyResult> {
  const res = await api.post(
    "/ai-product/shade-family",
    {
      barcodes: input.barcodes.map((b) => b.trim()).filter(Boolean),
      ...(input.hint?.trim() ? { hint: input.hint.trim() } : {}),
      ...(input.model?.trim() ? { model: input.model.trim() } : {}),
    },
    { timeout: 300_000 },
  );
  return parseShadeFamily(unwrap(res.data));
}

export type GlobalShadeEnrichResult = {
  barcodes: string[];
  brandAr: string;
  brandEn: string;
  nameAr: string;
  nameEn: string;
  shades: Array<{
    barcode: string;
    code: string;
    name: string;
    nameEn: string;
    nameAr: string;
    colorHex: string;
    source?: string;
    confidence?: number;
  }>;
  meta?: Record<string, unknown>;
};

export async function aiEnrichShadesGlobal(input: {
  barcodes: string[];
  hint?: string;
}): Promise<GlobalShadeEnrichResult> {
  const res = await api.post(
    "/ai-product/global-shade-enrich",
    {
      barcodes: input.barcodes.map((b) => b.trim()).filter(Boolean),
      ...(input.hint?.trim() ? { hint: input.hint.trim() } : {}),
    },
    { timeout: 120_000 },
  );
  const body = unwrap<Record<string, unknown>>(res.data);
  const shades = ((body.shades as unknown[]) ?? []).map((s) => {
    const row = s as Record<string, unknown>;
    return {
      barcode: String(row.barcode ?? ""),
      code: String(row.code ?? ""),
      name: String(row.name ?? ""),
      nameEn: String(row.nameEn ?? row.name ?? ""),
      nameAr: String(row.nameAr ?? row.name ?? ""),
      colorHex: String(row.colorHex ?? "#CCCCCC"),
      source: row.source ? String(row.source) : undefined,
      confidence: typeof row.confidence === "number" ? row.confidence : undefined,
    };
  });
  return {
    barcodes: ((body.barcodes as string[]) ?? []).map(String),
    brandAr: String(body.brandAr ?? ""),
    brandEn: String(body.brandEn ?? ""),
    nameAr: String(body.nameAr ?? ""),
    nameEn: String(body.nameEn ?? ""),
    shades,
    meta: (body.meta as Record<string, unknown>) ?? undefined,
  };
}

export async function aiSearchImages(input: {
  barcode: string;
  mode?: "barcode" | "name";
  query?: string;
  nameHint?: string;
}) {
  const res = await api.post(
    "/ai-product/images",
    {
      barcode: input.barcode.trim(),
      mode: input.mode ?? "barcode",
      ...(input.query?.trim() ? { query: input.query.trim() } : {}),
      ...(input.nameHint?.trim() ? { nameHint: input.nameHint.trim() } : {}),
    },
    { timeout: 90_000 },
  );
  const body = unwrap<Record<string, unknown>>(res.data);
  return pickImages(body);
}
