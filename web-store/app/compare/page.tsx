"use client";
/* eslint-disable @next/next/no-img-element */
import { useQueries } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeemaButton } from "@/components/advisor/DeemaButton";
import { Breadcrumbs } from "@/components/catalog/PageHero";
import { useHydrated } from "@/components/Providers";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { cardTitle } from "@/lib/brandSearch";
import { brandLabel, formatNumber, formatPrice } from "@/lib/format";
import { productHref } from "@/lib/links";
import { listedShades, productCover } from "@/lib/media";
import { useCart } from "@/lib/stores/cart";
import { useCompare } from "@/lib/stores/compare";
import { toast, useUi } from "@/lib/stores/ui";
import type { Product } from "@/lib/types";

/** الحجم من الاسم: «30 مل»، «50ml»، «100 غ» ← رقم ووحدة. */
function sizeOf(p: Product): { n: number; unit: string } | null {
  const m = `${p.nameAr ?? ""} ${p.name} ${p.nameEn ?? ""}`.match(/(\d+(?:\.\d+)?)\s*(مل|ml|ML|Ml|غ|غم|g|gm|جم)\b/);
  if (!m) return null;
  const unit = /مل|ml/i.test(m[2]) ? "مل" : "غ";
  return { n: Number(m[1]), unit };
}
const strip = (s?: string | null, n = 150) => {
  const t = (s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};
const list = (v?: string[] | string) => (Array.isArray(v) ? v : v ? v.split(/[,،]/) : []).map((x) => x.trim()).filter(Boolean);

type Row = { label: string; values: (string | React.ReactNode)[]; best?: number };

export default function ComparePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { items, remove, clear } = useCompare();
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const qs = useQueries({ queries: items.map((it) => ({ queryKey: ["product", it.slug], queryFn: () => api<Product>(`/products/${encodeURIComponent(it.slug)}`, { auth: false }), staleTime: 120_000 })) });
  const products = qs.map((q) => q.data).filter(Boolean) as Product[];
  const loading = qs.some((q) => q.isLoading);

  if (!hydrated) return <Skeleton className="container my-8 h-96" />;
  if (items.length < 2)
    return (
      <div className="container py-16 text-center">
        <p className="text-5xl">⚖️</p>
        <h1 className="mt-3 text-2xl font-extrabold">قارني بين المنتجات</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">اضغطي «قارني» في صفحة أي منتج أو من النظرة السريعة، وأضيفي منتجين أو أكثر (حتى 4) لتشوفينها جنب بعض.</p>
        {items.length === 1 && <p className="mt-2 text-sm font-bold text-accent-dark">عندكِ منتج واحد — أضيفي منتجاً آخر</p>}
        <Link href="/categories" className="btn-primary mt-6">
          تصفّحي المنتجات
        </Link>
      </div>
    );

  const bestBy = (vals: (number | null)[], mode: "min" | "max") => {
    const nums = vals.map((v, i) => [v, i] as const).filter(([v]) => v != null) as [number, number][];
    if (nums.length < 2 || new Set(nums.map(([v]) => v)).size < 2) return undefined;
    return nums.sort((a, b) => (mode === "min" ? a[0] - b[0] : b[0] - a[0]))[0][1];
  };
  const sizes = products.map(sizeOf);
  const perUnit = products.map((p, i) => (sizes[i] ? p.price / sizes[i]!.n : null));
  const sameUnit = sizes.length > 1 && sizes.every((s) => s && s.unit === sizes[0]?.unit);
  const rows: Row[] = [
    { label: "السعر", values: products.map((p) => <b key={p.id}>{formatPrice(p.price)}</b>), best: bestBy(products.map((p) => p.price), "min") },
    { label: "الخصم", values: products.map((p) => (p.discountPercent > 0 ? `${p.discountPercent}%` : "—")), best: bestBy(products.map((p) => p.discountPercent || null), "max") },
    { label: "الحجم", values: sizes.map((s) => (s ? `${formatNumber(s.n)} ${s.unit}` : "—")) },
    ...(sameUnit && perUnit.every((x) => x != null)
      ? [{ label: `السعر لكل ${sizes[0]!.unit}`, values: perUnit.map((x) => `${formatNumber(Math.round(x!))} د.ع`), best: bestBy(perUnit, "min") }]
      : []),
    { label: "التقييم", values: products.map((p) => (p.reviewCount ? `★ ${p.rating.toFixed(1)} (${p.reviewCount})` : "—")), best: bestBy(products.map((p) => (p.reviewCount ? p.rating : null)), "max") },
    { label: "البراند", values: products.map((p) => (p.brand ? brandLabel(p.brand.name) : "—")) },
    { label: "القسم", values: products.map((p) => p.subcategory?.name ?? p.category?.name ?? "—") },
    { label: "الألوان", values: products.map((p) => (listedShades(p).length ? `${listedShades(p).length} لون` : "—")) },
    { label: "نوع البشرة", values: products.map((p) => list(p.skinType).join("، ") || "—") },
    { label: "التوفر", values: products.map((p) => (p.stock > 0 ? <span key={p.id} className="font-bold text-success">متوفر</span> : <span key={p.id} className="text-sale">نفد</span>)) },
    { label: "الوصف", values: products.map((p) => strip(p.description) || "—") },
    { label: "المكوّنات", values: products.map((p) => strip(p.ingredients, 120) || "—") },
  ];

  const addOne = (p: Product) => {
    if (listedShades(p).length > 1) return router.push(productHref(p.slug));
    if (add(p, 1, listedShades(p)[0] ?? null)) {
      toast({ text: "أُضيف للسلة ✨", tone: "success" });
      openCart(true);
    }
  };

  return (
    <div className="container animate-fade-up py-4 md:py-8">
      <Breadcrumbs items={[{ label: "المقارنة" }]} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">مقارنة المنتجات ⚖️</h1>
        <DeemaButton action={`set:compare=${items.map((x) => x.id).join(",")};act:compare`} label="قارني بينهم ⚖️" className="ms-auto flex h-11 items-center gap-2 rounded-full bg-accent-light px-4 text-sm font-bold text-accent-dark">
          خلّي ديما تختار الأنسب لكِ
        </DeemaButton>
        <button onClick={clear} className="text-sm font-bold text-ink-muted hover:text-sale">
          مسح الكل
        </button>
      </div>
      <div className="no-scrollbar mt-5 overflow-x-auto rounded-[28px] bg-surface shadow-card">
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <colgroup>
            <col className="w-32 md:w-40" />
            {items.map((it) => (
              <col key={it.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="align-top">
              <th className="p-4" />
              {items.map((it, i) => {
                const p = products.find((x) => x.id === it.id);
                return (
                  <th key={it.id} className="p-4 text-start font-normal">
                    <div className="relative">
                      <button onClick={() => remove(it.id)} className="absolute left-0 top-0 z-10 rounded-full bg-canvas p-1.5 text-ink-muted hover:text-sale" aria-label="إزالة">
                        <Icon name="close" size={14} />
                      </button>
                      <Link href={productHref(it.slug)} className="block aspect-square overflow-hidden rounded-2xl bg-white p-3">
                        <img src={p ? productCover(p, "small") : it.image} alt="" className="h-full w-full object-contain" />
                      </Link>
                      {p ? (
                        <>
                          {p.brand && <p className="mt-2 text-[11px] font-extrabold uppercase text-accent-dark">{brandLabel(p.brand.name)}</p>}
                          <Link href={productHref(p.slug)} className="line-clamp-2 font-semibold leading-6 hover:text-accent-dark">
                            {cardTitle(p)}
                          </Link>
                          <button onClick={() => addOne(p)} disabled={p.stock <= 0} className="btn-primary mt-3 h-10 w-full text-xs">
                            <Icon name="bag" size={15} /> {p.stock <= 0 ? "نفد" : listedShades(p).length > 1 ? "اختاري اللون" : "أضيفي للسلة"}
                          </button>
                        </>
                      ) : (
                        <Skeleton className="mt-2 h-16" />
                      )}
                      {qs[i]?.isError && <p className="mt-2 text-xs text-sale">تعذّر التحميل</p>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          {!loading && products.length === items.length && (
            <tbody className="divide-y divide-hairline">
              {rows.filter((r) => r.values.some((v) => v !== "—")).map((r) => (
                <tr key={r.label} className="align-top">
                  <td className="bg-canvas/50 p-4 text-xs font-extrabold text-ink-muted">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={clsx("p-4 leading-6 text-ink-soft", r.best === i && "bg-emerald-50 font-bold text-success")}>
                      {v}
                      {r.best === i && <span className="ms-1 text-[10px]">✓ الأفضل</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
