"use client";

import { PageBuilderStudio } from "@/components/home-builder/PageBuilderStudio";

export default function HomeBuilderPage() {
  return (
    <PageBuilderStudio
      pageKey="HOME"
      blocksQueryKey="home-blocks"
      exportFilePrefix="home-blocks"
      title="استوديو الصفحة الرئيسية"
      subtitle="رتّب الأقسام، خصّص الإطارات والمعارض — النتيجة مباشرة في تطبيق الهاتف"
      infoBanner={{
        message: "الرأس ثابت في التطبيق",
        description:
          "البحث، البنر، الاختصارات، وأيقونات الفئات — من صفحات البنرات والفئات. هنا تُبنى الأقسام أسفلها فقط.",
      }}
    />
  );
}
