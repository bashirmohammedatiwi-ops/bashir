"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Input,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
} from "antd";
import { useMemo, useState } from "react";
import { normalizeBarcode } from "@/lib/barcode";
import { matchBrandIdLocal } from "@/lib/catalogBrandMatch";
import { matchBestNamedEntity, matchNamedLabels } from "@/lib/catalogCategoryMatch";
import {
  lookupInventoryBarcodes,
  resolveBarcodeLookup,
  type BarcodeInventoryLookup,
} from "@/lib/inventorySync";
import { parseProductTablePaste, type PastedProductRow } from "@/lib/parseProductTablePaste";
import { slugSourceName } from "@/lib/productName";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

type NamedRow = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  parentId?: string | null;
};

type ResolvedRow = PastedProductRow & {
  brandId?: string;
  brandLabel?: string;
  categoryId?: string;
  categoryLabel?: string;
  subcategoryIds: string[];
  subcategoryLabels: string[];
  tertiaryCategoryIds: string[];
  tertiaryLabels: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  existsInApp: boolean;
  warnings: string[];
  canImport: boolean;
};

type Phase = "paste" | "preview" | "importing" | "done";

type Props = {
  open: boolean;
  onClose: () => void;
};

function asNamedRows(raw: unknown): NamedRow[] {
  if (Array.isArray(raw)) return raw as NamedRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as { data?: unknown; items?: unknown };
    if (Array.isArray(obj.data)) return obj.data as NamedRow[];
    if (Array.isArray(obj.items)) return obj.items as NamedRow[];
  }
  return [];
}

function labelOf(entities: NamedRow[], id?: string) {
  if (!id) return "";
  const hit = entities.find((e) => e.id === id);
  return hit?.nameAr || hit?.name || hit?.nameEn || "";
}

function labelsOf(entities: NamedRow[], ids: string[]) {
  return ids.map((id) => labelOf(entities, id)).filter(Boolean);
}

/** Normalize Word / Excel paste into markdown-ish rows the parser understands. */
function normalizePasteText(raw: string): string {
  let text = String(raw ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (!text) return "";

  // If user pasted HTML table (rare in textarea, but handle anyway)
  if (/<table[\s>]/i.test(text)) {
    try {
      const doc = new DOMParser().parseFromString(text, "text/html");
      const rows = [...doc.querySelectorAll("tr")].map((tr) =>
        [...tr.querySelectorAll("th,td")]
          .map((td) => (td.textContent || "").replace(/\s+/g, " ").trim())
          .join("\t"),
      );
      text = rows.filter(Boolean).join("\n");
    } catch {
      /* keep raw */
    }
  }

  return text;
}

function buildPayload(row: ResolvedRow) {
  const nameAr = row.nameAr.trim();
  const nameEn = row.nameEn.trim();
  const name = nameAr || nameEn;
  return {
    sku: `AI-${row.barcode}`,
    barcode: normalizeBarcode(row.barcode) || undefined,
    name,
    nameAr: nameAr || undefined,
    nameEn: nameEn || undefined,
    slug: slugify(slugSourceName({ nameAr, nameEn, name }), "product"),
    brandId: row.brandId,
    categoryId: row.categoryId || null,
    subcategoryIds: row.subcategoryIds,
    tertiaryCategoryIds: row.tertiaryCategoryIds,
    description: row.descriptionAr.trim() || row.descriptionEn.trim() || "",
    descriptionAr: row.descriptionAr.trim() || undefined,
    descriptionEn: row.descriptionEn.trim() || undefined,
    ingredients: "",
    howToUse: "",
    price: Number(row.price ?? 0),
    originalPrice: Number(row.originalPrice ?? 0),
    discountPercent: Number(row.discountPercent ?? 0),
    stock: Number(row.stock ?? 0),
    pointsEarned: 0,
    rating: 0,
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    isPromo: false,
    isBogo: false,
    isActive: true,
    tags: [] as string[],
    skinType: [] as string[],
    concernIds: [] as string[],
    imageIds: [] as string[],
    shades: [] as unknown[],
    variants: [] as unknown[],
  };
}

async function resolveRows(raw: string): Promise<ResolvedRow[]> {
  const parsed = parseProductTablePaste(normalizePasteText(raw));
  if (!parsed.length) {
    throw new Error(
      "لم يتم التعرف على صفوف. الصق جدولاً فيه الباركود والأسماء (من Word أو GPT).",
    );
  }

  const [brandsRaw, categoriesRaw, subcategoriesRaw, tertiaryRaw] = await Promise.all([
    queries.brands({ activeOnly: true }),
    queries.categories(),
    queries.subcategories(),
    queries.tertiarySections(),
  ]);

  const brandRows = asNamedRows(brandsRaw);
  const catRows = asNamedRows(categoriesRaw);
  const subRows = asNamedRows(subcategoriesRaw);
  const tertRows = asNamedRows(tertiaryRaw);

  let invMap: Record<string, BarcodeInventoryLookup> = {};
  try {
    invMap = await lookupInventoryBarcodes(parsed.map((r) => r.barcode));
  } catch {
    invMap = {};
  }

  const brandCache = new Map<string, string | undefined>();
  const out: ResolvedRow[] = [];

  for (const row of parsed) {
    const warnings: string[] = [];
    const brandKey = row.brand.trim().toLowerCase();
    let brandId = brandCache.get(brandKey);

    if (!brandCache.has(brandKey)) {
      brandId = matchBrandIdLocal(brandRows, row.brand, row.brand);
      if (!brandId && row.brand.trim()) {
        try {
          const created = await mutations.resolveBrand({
            brandAr: row.brand,
            brandEn: row.brand,
            createIfMissing: true,
          });
          brandId = created?.brand?.id || created?.id;
          if (brandId) {
            brandRows.push({
              id: brandId,
              name: row.brand,
              nameAr: row.brand,
              nameEn: row.brand,
            });
          }
        } catch {
          warnings.push("تعذّر إنشاء/مطابقة البراند");
        }
      }
      brandCache.set(brandKey, brandId);
    }
    if (!brandId) warnings.push("البراند غير معروف");

    const categoryId = matchBestNamedEntity(catRows, row.category, 40);
    if (!categoryId && row.category.trim()) warnings.push("القسم غير مطابق");

    const subcategoryIds = matchNamedLabels(
      subRows,
      row.subcategory,
      50,
      categoryId ? [categoryId] : undefined,
    );
    if (row.subcategory.trim() && !subcategoryIds.length) {
      warnings.push("القسم الفرعي غير مطابق");
    }

    const tertiaryCategoryIds = matchNamedLabels(
      tertRows,
      row.tertiary,
      50,
      subcategoryIds.length ? subcategoryIds : undefined,
    );
    if (row.tertiary.trim() && !tertiaryCategoryIds.length) {
      warnings.push("القسم الثانوي غير مطابق");
    }

    const inv = resolveBarcodeLookup(row.barcode, invMap);
    const existsInApp = Boolean(inv?.inApp?.id);
    if (existsInApp) warnings.push("موجود مسبقاً في المتجر");

    const price = Number(inv?.pos?.price ?? 0);
    const originalPrice = Number(inv?.pos?.originalPrice ?? 0);
    const discountPercent = Number(inv?.pos?.discountPercent ?? 0);
    const stock = Number(inv?.pos?.stock ?? 0);
    if (!inv?.pos) warnings.push("لا بيانات POS للسعر/المخزون");

    out.push({
      ...row,
      brandId,
      brandLabel: row.brand || labelOf(brandRows, brandId),
      categoryId,
      categoryLabel: labelOf(catRows, categoryId) || row.category,
      subcategoryIds,
      subcategoryLabels: labelsOf(subRows, subcategoryIds),
      tertiaryCategoryIds,
      tertiaryLabels: labelsOf(tertRows, tertiaryCategoryIds),
      price,
      originalPrice,
      discountPercent,
      stock,
      existsInApp,
      warnings,
      canImport: Boolean(brandId && categoryId && !existsInApp && (row.nameAr || row.nameEn)),
    });
  }

  return out;
}

export function BulkProductPasteModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("paste");
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null,
  );
  const [progress, setProgress] = useState({ done: 0, total: 0, last: "" });
  const [result, setResult] = useState<{ ok: number; skipped: number; failed: number } | null>(
    null,
  );

  const reset = () => {
    setPhase("paste");
    setRaw("");
    setRows([]);
    setBusy(false);
    setBanner(null);
    setProgress({ done: 0, total: 0, last: "" });
    setResult(null);
  };

  const handleClose = () => {
    if (phase === "importing") return;
    reset();
    onClose();
  };

  const stats = useMemo(() => {
    const importable = rows.filter((r) => r.canImport).length;
    const exists = rows.filter((r) => r.existsInApp).length;
    return { importable, exists, blocked: rows.length - importable };
  }, [rows]);

  const onParse = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const resolved = await resolveRows(raw);
      setRows(resolved);
      setPhase("preview");
      setBanner({ type: "success", text: `تم تحليل ${resolved.length} منتج` });
    } catch (e) {
      setBanner({
        type: "error",
        text: e instanceof Error ? e.message : "فشل التحليل",
      });
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    const importable = rows.filter((r) => r.canImport);
    if (!importable.length) {
      setBanner({ type: "error", text: "لا توجد صفوف صالحة للاستيراد" });
      return;
    }

    setBusy(true);
    setPhase("importing");
    setProgress({ done: 0, total: importable.length, last: "" });
    setBanner(null);

    let ok = 0;
    let failed = 0;
    const skipped = rows.length - importable.length;

    for (let i = 0; i < importable.length; i++) {
      const row = importable[i];
      try {
        await mutations.createProduct(buildPayload(row));
        ok += 1;
      } catch (err) {
        failed += 1;
        const msg =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
            ?.message ||
          (err as Error)?.message ||
          "فشل";
        setProgress({ done: i + 1, total: importable.length, last: `${row.barcode}: ${msg}` });
        continue;
      }
      setProgress({ done: i + 1, total: importable.length, last: row.barcode });
    }

    setResult({ ok, skipped, failed });
    setPhase("done");
    setBusy(false);
    void qc.invalidateQueries({ queryKey: ["products"] });
    setBanner({
      type: failed ? "error" : "success",
      text: `تم إنشاء ${ok} · تخطي ${skipped} · فشل ${failed}`,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={1100}
      destroyOnHidden
      title="إضافة جماعية من جدول"
      footer={
        phase === "paste" ? (
          <Space>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button type="primary" loading={busy} disabled={!raw.trim()} onClick={() => void onParse()}>
              تحليل الجدول
            </Button>
          </Space>
        ) : phase === "preview" ? (
          <Space>
            <Button disabled={busy} onClick={() => setPhase("paste")}>
              تعديل اللصق
            </Button>
            <Button disabled={busy} onClick={handleClose}>
              إلغاء
            </Button>
            <Button
              type="primary"
              loading={busy}
              disabled={!stats.importable}
              onClick={() => void onImport()}
            >
              استيراد {stats.importable} منتج
            </Button>
          </Space>
        ) : phase === "importing" ? (
          <Button disabled>جاري الاستيراد…</Button>
        ) : (
          <Button type="primary" onClick={handleClose}>
            إغلاق
          </Button>
        )
      }
    >
      {banner ? (
        <Alert
          type={banner.type === "error" ? "error" : banner.type === "success" ? "success" : "info"}
          showIcon
          style={{ marginBottom: 12 }}
          message={banner.text}
        />
      ) : null}

      {phase === "paste" ? (
        <div>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="الصق جدولاً من Word أو GPT"
            description="الأعمدة: الباركود · الاسم عربي · الاسم إنكليزي · البراند · الوصف عربي · الوصف إنكليزي · القسم · القسم الفرعي · القسم الثانوي. الأقسام المتعددة تُفصل بـ ،"
          />
          <Input.TextArea
            rows={14}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            dir="auto"
            style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12 }}
            placeholder="الصق هنا الجدول كاملاً من ملف Word أو من GPT…"
          />
        </div>
      ) : null}

      {phase === "preview" || phase === "importing" || phase === "done" ? (
        <div>
          <Space wrap style={{ marginBottom: 12 }}>
            <Tag color="blue">الإجمالي: {rows.length}</Tag>
            <Tag color="green">قابل للاستيراد: {stats.importable}</Tag>
            <Tag color="orange">موجود مسبقاً: {stats.exists}</Tag>
            <Tag color="red">سيُتخطى: {stats.blocked}</Tag>
          </Space>

          {phase === "importing" ? (
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={progress.total ? Math.round((progress.done / progress.total) * 100) : 0}
                status="active"
              />
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                {progress.done}/{progress.total}
                {progress.last ? ` — ${progress.last}` : ""}
              </div>
            </div>
          ) : null}

          {phase === "done" && result ? (
            <Alert
              type={result.failed ? "warning" : "success"}
              showIcon
              style={{ marginBottom: 12 }}
              message={`تم: ${result.ok} · تخطي: ${result.skipped} · فشل: ${result.failed}`}
            />
          ) : null}

          <Table
            size="small"
            rowKey="barcode"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            scroll={{ x: 1100 }}
            dataSource={rows}
            columns={[
              {
                title: "الباركود",
                dataIndex: "barcode",
                width: 140,
                render: (v: string) => <span dir="ltr">{v}</span>,
              },
              {
                title: "الاسم",
                width: 260,
                render: (_: unknown, r: ResolvedRow) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.nameAr || r.nameEn}</div>
                    {r.nameEn && r.nameAr ? (
                      <div style={{ fontSize: 12, color: "#888" }}>{r.nameEn}</div>
                    ) : null}
                  </div>
                ),
              },
              { title: "البراند", dataIndex: "brandLabel", width: 110 },
              {
                title: "التصنيف",
                width: 220,
                render: (_: unknown, r: ResolvedRow) => (
                  <div style={{ fontSize: 12 }}>
                    <div>{r.categoryLabel || "—"}</div>
                    {r.subcategoryLabels.length ? (
                      <div style={{ color: "#666" }}>{r.subcategoryLabels.join(" · ")}</div>
                    ) : null}
                    {r.tertiaryLabels.length ? (
                      <div style={{ color: "#999" }}>{r.tertiaryLabels.join(" · ")}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                title: "POS",
                width: 120,
                render: (_: unknown, r: ResolvedRow) => (
                  <div style={{ fontSize: 12 }}>
                    <div>{Number(r.price || 0).toLocaleString("ar-IQ")} د.ع</div>
                    <div style={{ color: "#888" }}>مخزون {r.stock}</div>
                  </div>
                ),
              },
              {
                title: "الحالة",
                width: 180,
                render: (_: unknown, r: ResolvedRow) =>
                  r.canImport ? (
                    <Tag color="success">جاهز</Tag>
                  ) : (
                    <Space direction="vertical" size={2}>
                      {r.warnings.map((w) => (
                        <Tag key={w} color={r.existsInApp ? "orange" : "error"}>
                          {w}
                        </Tag>
                      ))}
                    </Space>
                  ),
              },
            ]}
          />
        </div>
      ) : null}
    </Modal>
  );
}

export default BulkProductPasteModal;
