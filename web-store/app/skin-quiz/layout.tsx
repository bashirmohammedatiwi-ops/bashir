import type { Metadata } from "next";
export const metadata: Metadata = { title: "اختبار البشرة", description: "4 أسئلة لتعرفي نوع بشرتكِ وتحصلي على روتين صباح ومساء مناسب.", alternates: { canonical: "/skin-quiz" } };
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
