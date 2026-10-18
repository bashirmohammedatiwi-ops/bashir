import type { Metadata } from "next";
export const metadata: Metadata = { title: "مقارنة المنتجات", robots: { index: false } };
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
