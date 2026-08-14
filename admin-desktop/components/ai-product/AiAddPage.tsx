"use client";

import { PageHeader } from "@/components/PageHeader";
import { AiSingleProductWizard } from "./AiSingleProductWizard";
import "./ai-product.css";

/** Smart add hub — single product only (shade-family AI removed). */
export function AiAddPage() {
  return (
    <div className="ai-hub">
      <PageHeader
        title="الإضافة الذكية"
        subtitle="منتج مفرد بالباركود — اختر الموديل، راجع التسمية والصور، ثم احفظ في المتجر"
      />

      <section className="ai-hub-hero">
        <div className="ai-hub-hero-inner">
          <div>
            <div className="ai-hub-kicker">✦ منتج مفرد · عدة موديلات · بحث صور</div>
            <h2 className="ai-hub-title">إضافة منتج واحد بسرعة</h2>
            <p className="ai-hub-subtitle">
              أدخل الباركود، اختر نموذج التسمية (Terra / Sol / Luna / Composer)، راجع الأسماء والصور
              والتصنيف، ثم احفظ مباشرة. للتدرجات اليدوية استخدم قسم المنتجات.
            </p>
          </div>
          <div className="ai-hub-badge" aria-hidden>
            AI
          </div>
        </div>
      </section>

      <div className="ai-features" style={{ marginBottom: 20 }}>
        <div className="ai-feature-chip">
          <span style={{ fontSize: 22 }}>🧠</span>
          <div>
            <strong>اختيار الموديل</strong>
            <span>Terra للموصى به، Sol للأقوى، Luna/Composer للأسرع</span>
          </div>
        </div>
        <div className="ai-feature-chip">
          <span style={{ fontSize: 22 }}>🖼️</span>
          <div>
            <strong>صور من المتاجر</strong>
            <span>بحث بالباركود والاسم مع اختيار يدوي قبل الحفظ</span>
          </div>
        </div>
        <div className="ai-feature-chip">
          <span style={{ fontSize: 22 }}>✓</span>
          <div>
            <strong>حفظ مباشر</strong>
            <span>رفع الصور وإنشاء المنتج من نفس الشاشة</span>
          </div>
        </div>
      </div>

      <AiSingleProductWizard open onClose={() => undefined} embedded />
    </div>
  );
}
