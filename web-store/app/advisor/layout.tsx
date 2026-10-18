import type { Metadata } from "next";
export const metadata: Metadata = { title: "ديما — مستشارتكِ الجمالية", description: "اسألي ديما عن أي منتج تجميل أو عناية أو عطر — ترشيحات مخصّصة لبشرتكِ وذوقكِ مع السبب.", alternates: { canonical: "/advisor" } };
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
