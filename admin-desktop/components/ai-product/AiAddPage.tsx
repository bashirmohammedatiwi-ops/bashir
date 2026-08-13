"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AiSingleProductWizard } from "./AiSingleProductWizard";
import { AiShadeFamilyWizard } from "./AiShadeFamilyWizard";
import "./ai-product.css";

type Mode = "hub" | "single" | "shade";

export function AiAddPage() {
  const [mode, setMode] = useState<Mode>("hub");

  return (
    <div className="ai-hub">
      {mode === "hub" ? (
        <>
          <PageHeader
            title="الإضافة الذكية"
            subtitle="أضف منتجات مكياج بالذكاء الاصطناعي — منتج مفرد أو عائلة تدرجات كاملة"
          />

          <section className="ai-hub-hero">
            <div className="ai-hub-hero-inner">
              <div>
                <div className="ai-hub-kicker">✦ Composer 2.5 · تأكيد الاسم · بحث الصور</div>
                <h2 className="ai-hub-title">أضف منتجات أسرع وبجودة احترافية</h2>
                <p className="ai-hub-subtitle">
                  نفس تقنية تطبيق الموظفين — الآن في لوحة التحكم. التعرف على الباركود، التسمية
                  ثنائية اللغة، صور المتاجر، والتصنيف التلقائي في خطوات منظمة.
                </p>
              </div>
              <div className="ai-hub-badge" aria-hidden>
                AI
              </div>
            </div>
          </section>

          <div className="ai-mode-grid">
            <button type="button" className="ai-mode-card single" onClick={() => setMode("single")}>
              <div className="ai-mode-icon">📦</div>
              <h3>منتج مفرد</h3>
              <p>
                باركود واحد → تعرف تلقائي على الاسم والبراند والصور والتصنيف. مثالي لمنتج بدون
                تدرجات أو بدرجة لون واحدة.
              </p>
              <div className="ai-mode-tags">
                <span className="ai-mode-tag">باركود واحد</span>
                <span className="ai-mode-tag">تسمية AI</span>
                <span className="ai-mode-tag">بحث صور</span>
              </div>
            </button>

            <button type="button" className="ai-mode-card shade" onClick={() => setMode("shade")}>
              <div className="ai-mode-icon">🎨</div>
              <h3>عائلة تدرجات</h3>
              <p>
                عدة باركودات لنفس المنتج — كل تدرج باسمه وصورته. مناسب لأحمر الشفاه، كريم الأساس،
                وأي منتج بعدة درجات.
              </p>
              <div className="ai-mode-tags">
                <span className="ai-mode-tag">متعدد الباركود</span>
                <span className="ai-mode-tag">صورة لكل تدرج</span>
                <span className="ai-mode-tag">POS تلقائي</span>
              </div>
            </button>
          </div>

          <div className="ai-features">
            <div className="ai-feature-chip">
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <strong>تعرف سريع</strong>
                <span>مصمم لـ 12–15 باركود دون انقطاع — مع fallback ذكي</span>
              </div>
            </div>
            <div className="ai-feature-chip">
              <span style={{ fontSize: 22 }}>🖼️</span>
              <div>
                <strong>صور من المتاجر</strong>
                <span>بحث Google + كتالوج Faces و Miswag و Miraaya</span>
              </div>
            </div>
            <div className="ai-feature-chip">
              <span style={{ fontSize: 22 }}>✓</span>
              <div>
                <strong>حفظ مباشر</strong>
                <span>رفع الصور وإنشاء المنتج في المتجر من نفس الشاشة</span>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mode === "single" ? (
        <div>
          <button type="button" className="ai-mode-tag" style={{ marginBottom: 16, cursor: "pointer", border: 0 }} onClick={() => setMode("hub")}>
            ← العودة للقائمة
          </button>
          <AiSingleProductWizard open onClose={() => setMode("hub")} />
        </div>
      ) : null}

      {mode === "shade" ? (
        <div>
          <button type="button" className="ai-mode-tag" style={{ marginBottom: 16, cursor: "pointer", border: 0 }} onClick={() => setMode("hub")}>
            ← العودة للقائمة
          </button>
          <AiShadeFamilyWizard open onClose={() => setMode("hub")} />
        </div>
      ) : null}
    </div>
  );
}
