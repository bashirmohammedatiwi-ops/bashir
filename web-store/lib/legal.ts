export type LegalLang = "ar" | "en";

export type LegalSection = {
  id: string;
  title: string;
  intro?: string;
  bullets?: string[];
};

export const LEGAL_UPDATED: Record<LegalLang, string> = {
  ar: "يوليو 2026",
  en: "July 2026",
};

export const SUPPORT_EMAIL = "support@deemaalhayat.com";

export const legalPageCopy = {
  privacy: {
    ar: {
      title: "سياسة الخصوصية",
      description: "سياسة الخصوصية لمتجر ديما الحياة — كيف نجمع بياناتك ونحميها",
      updatedLabel: "آخر تحديث",
      contactTitle: "هل لديكِ سؤال؟",
      contactBody: "فريق دعم ديما الحياة جاهز لمساعدتك في أي استفسار متعلق بالخصوصية أو الشروط.",
      backToStore: "العودة للمتجر",
      switchLang: "English version",
    },
    en: {
      title: "Privacy Policy",
      description: "deema alhayat privacy policy — how we collect and protect your data",
      updatedLabel: "Last updated",
      contactTitle: "Have a question?",
      contactBody: "Our support team is happy to help with privacy or terms questions.",
      backToStore: "Back to store",
      switchLang: "النسخة العربية",
    },
  },
  terms: {
    ar: {
      title: "شروط الاستخدام",
      description: "شروط استخدام متجر ديما الحياة",
      updatedLabel: "آخر تحديث",
      contactTitle: "هل لديكِ سؤال؟",
      contactBody: "فريق دعم ديما الحياة جاهز لمساعدتك في أي استفسار متعلق بالخصوصية أو الشروط.",
      backToStore: "العودة للمتجر",
      switchLang: "English version",
    },
    en: {
      title: "Terms of Service",
      description: "deema alhayat terms of service",
      updatedLabel: "Last updated",
      contactTitle: "Have a question?",
      contactBody: "Our support team is happy to help with privacy or terms questions.",
      backToStore: "Back to store",
      switchLang: "النسخة العربية",
    },
  },
} as const;

export const privacySections: Record<LegalLang, LegalSection[]> = {
  ar: [
    {
      id: "intro",
      title: "مقدمة",
      intro:
        "نحن في ديما الحياة نحترم خصوصيتك. توضّح هذه السياسة البيانات التي نجمعها وكيف نستخدمها ونحميها عند استخدامك لتطبيقنا وموقعنا.",
    },
    {
      id: "collect",
      title: "البيانات التي نجمعها",
      bullets: [
        "الاسم ورقم الهاتف عند إنشاء الحساب أو إتمام الطلب.",
        "عناوين التوصيل التي تضيفينها.",
        "سجل الطلبات والمفضلة ونقاط الولاء المرتبطة بحسابك.",
        "إشعارات داخل التطبيق (قائمة حسابي) عند تسجيل الدخول.",
      ],
    },
    {
      id: "use",
      title: "كيف نستخدم البيانات",
      bullets: [
        "معالجة الطلبات والتوصيل والدعم.",
        "تحسين تجربة التسوق والعروض المناسبة.",
        "التواصل بخصوص حالة الطلب.",
      ],
    },
    {
      id: "share",
      title: "مشاركة البيانات",
      intro:
        "لا نبيع بياناتك الشخصية. نشارك الحد الأدنى اللازم فقط مع شركاء التوصيل لتسليم طلبك.",
    },
    {
      id: "retention",
      title: "الاحتفاظ بالبيانات",
      intro:
        "نحتفظ ببيانات الحساب طالما كان نشطاً. يمكنك حذف حسابك من التطبيق (حسابي ← حذف الحساب).",
    },
    {
      id: "rights",
      title: "حقوقك",
      intro:
        "يمكنك تعديل بياناتك أو حذف حسابك من داخل التطبيق، أو التواصل معنا عبر قنوات الدعم.",
    },
  ],
  en: [
    {
      id: "intro",
      title: "Introduction",
      intro:
        "At deema alhayat we respect your privacy. This policy explains what data we collect and how we use and protect it when you use our app and website.",
    },
    {
      id: "collect",
      title: "Data we collect",
      bullets: [
        "Name and phone number when you register or place an order.",
        "Delivery addresses you save.",
        "Order history, wishlist, and loyalty points linked to your account.",
        "In-app notifications (Account → Notifications) when signed in.",
      ],
    },
    {
      id: "use",
      title: "How we use data",
      bullets: [
        "Process orders, delivery, and customer support.",
        "Improve shopping experience and relevant offers.",
        "Contact you about order status.",
      ],
    },
    {
      id: "share",
      title: "Sharing",
      intro:
        "We do not sell your personal data. We share only what is necessary with delivery partners to fulfill your order.",
    },
    {
      id: "retention",
      title: "Retention",
      intro:
        "We keep account data while your account is active. You can delete your account in the app (Account → Delete Account).",
    },
    {
      id: "rights",
      title: "Your rights",
      intro:
        "You may update or delete your account in the app, or contact us through support channels.",
    },
  ],
};

export const termsSections: Record<LegalLang, LegalSection[]> = {
  ar: [
    {
      id: "service",
      title: "الخدمة",
      intro:
        "المنصة تتيح تصفح المنتجات وطلبها مع الدفع عند الاستلام (COD) ما لم يُفعّل لاحقاً الدفع الإلكتروني.",
    },
    {
      id: "account",
      title: "الحساب",
      bullets: [
        "يجب تقديم معلومات صحيحة (الاسم، الهاتف، العنوان).",
        "أنتِ مسؤولة عن سرية كلمة المرور.",
        "يحق لنا تعليق الحساب عند إساءة الاستخدام.",
      ],
    },
    {
      id: "orders",
      title: "الطلبات والأسعار",
      bullets: [
        "الأسعار بالدينار العراقي وقد تتغير دون إشعار مسبق.",
        "نؤكد الطلب عبر الهاتف أو الإشعارات قبل الشحن.",
        "يمكن إلغاء الطلب قبل التجهيز وفق سياسة المتجر.",
      ],
    },
    {
      id: "delivery",
      title: "الدفع والتوصيل",
      intro:
        "الدفع عند الاستلام نقداً ما لم يُذكر خلاف ذلك. أوقات التوصيل تقديرية وقد تتأثر بعوامل خارجة عن إرادتنا.",
    },
    {
      id: "ip",
      title: "الملكية الفكرية",
      intro:
        "العلامات والصور والمحتوى مملوكة لديما الحياة أو مورّديها ولا يجوز نسخها دون إذن.",
    },
    {
      id: "termination",
      title: "إنهاء الخدمة",
      intro:
        "يمكنك حذف حسابك من التطبيق. نحتفظ بسجلات الطلبات السابقة للأغراض القانونية والمحاسبية.",
    },
    {
      id: "law",
      title: "القانون الحاكم",
      intro: "تخضع هذه الشروط للقوانين المعمول بها في جمهورية العراق.",
    },
  ],
  en: [
    {
      id: "service",
      title: "Service",
      intro:
        "The platform lets you browse and order products with cash on delivery (COD) unless online payment is enabled later.",
    },
    {
      id: "account",
      title: "Account",
      bullets: [
        "Provide accurate information (name, phone, address).",
        "You are responsible for keeping your password secure.",
        "We may suspend accounts for misuse.",
      ],
    },
    {
      id: "orders",
      title: "Orders & pricing",
      bullets: [
        "Prices are in Iraqi dinar and may change without prior notice.",
        "We confirm orders by phone or notification before shipping.",
        "Cancellation before fulfillment follows store policy.",
      ],
    },
    {
      id: "delivery",
      title: "Payment & delivery",
      intro:
        "Cash on delivery unless stated otherwise. Delivery times are estimates and may vary.",
    },
    {
      id: "ip",
      title: "Intellectual property",
      intro:
        "Brands, images, and content belong to deema alhayat or suppliers and may not be copied without permission.",
    },
    {
      id: "termination",
      title: "Termination",
      intro:
        "You may delete your account in the app. Past order records may be retained for legal and accounting purposes.",
    },
    {
      id: "law",
      title: "Governing law",
      intro: "These terms are governed by applicable laws in the Republic of Iraq.",
    },
  ],
};

export function legalPath(variant: "privacy" | "terms", lang: LegalLang): string {
  const base = variant === "privacy" ? "/privacy" : "/terms";
  return lang === "en" ? `/en${base}/` : `${base}/`;
}
