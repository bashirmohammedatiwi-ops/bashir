"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { SectionHeader } from "../ui/SectionHeader";
import { ProductRow } from "./ProductRow";

const KEY = "dh-recent-products";

export function rememberProduct(p: Product) {
  try {
    const slim: Product = { ...p, description: null, ingredients: null, howToUse: null, reviews: [] };
    const list: Product[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    localStorage.setItem(KEY, JSON.stringify([slim, ...list.filter((x) => x.id !== p.id)].slice(0, 16)));
  } catch {}
}

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [list, setList] = useState<Product[]>([]);
  useEffect(() => {
    try {
      setList((JSON.parse(localStorage.getItem(KEY) ?? "[]") as Product[]).filter((p) => p.id !== excludeId));
    } catch {}
  }, [excludeId]);
  if (list.length < 2) return null;
  return (
    <section className="container py-6 md:py-10">
      <SectionHeader title="شاهدتِها مؤخراً" />
      <ProductRow products={list} />
    </section>
  );
}
