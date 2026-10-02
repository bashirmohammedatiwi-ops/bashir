# نظام تصميم تطبيق الحياة — المرجع

> نُفّذ ضمن ترقية "النقلة النوعية في التفاصيل" (2026-10). هذا المرجع ملزم لأي واجهة جديدة.

## الهوية اللونية — مصدر واحد

`lib/core/theme/app_colors.dart` هو **المصدر الوحيد**. بقية الثيمات (CartTheme/HomeTheme/AccountTheme/CheckoutTheme/SplashTheme/OffersTheme) تقرأ منه ولا تعرّف ثوابت لونية خاصة.

| الدور | الثابت | القيمة |
|---|---|---|
| الهوية الأساسية (تركواز اللوغو) | `AppColors.primary` | `0xFF3A9E8F` |
| الغامق | `AppColors.primaryDark` | `0xFF2F7F73` |
| الفاتح / الغسيل | `primaryLight` / `primarySoft` | `0xFFE8F5F3` / `0xFFF4FAF9` |
| **الوردي — للعروض/التخفيضات/القلوب فقط** | `AppColors.rose` | `0xFFD41F5C` |
| الذهبي الفاخر | `AppColors.accent` | `0xFFB8954A` |
| خلفية | `scaffold` | `0xFFF6FAF9` |
| نص أساسي/ثانوي/خافت | `textPrimary/textSecondary/textMuted` | `0xFF2D2D2D` / `0xFF6B7A76` / `0xFF9AABA6` |
| حد موحد / divider | `border` / `divider` | `0xFFE3EDEA` / `0xFFEDF3F1` |

قاعدة: **لا hex colors جديدة في الشاشات** — إن احتجت لوناً جديداً أضفه كـ token.

## الحركة — `lib/core/theme/app_motion.dart`

- مدد: `instant 90ms` / `fast 150ms` / `base 220ms` / `slow 320ms` / `page 260ms` / `fadeThrough 180ms`.
- منحنيات: `ease (easeOutCubic)` افتراضياً، `spring` للارتدادات، `springSoft` للنبضات.
- تتابع الدخول: `StaggerEntrance(index: i)` — 45ms بين العناصر، أول 8 عناصر فقط.
- أدوات جاهزة في `core/widgets/entrance.dart`:
  - `StaggerEntrance` — ظهور متتابع (شبكات/قوائم/أقسام).
  - `AnimatedNumber` — عدّ الأرقام (إجماليات).
  - `PulseOnChange(trigger:)` — نبضة عند تغير قيمة (قلب المفضلة).
  - `ShakeOnError(trigger:)` — اهتزاز أخطاء (الكوبون).
- `SuccessBurst` (`core/widgets/success_burst.dart`) — انفجار فراشات الهوية للنجاحات.

## الانتقالات

- **Hero**: صور المنتجات تحمل tag موحد `product-image-{id}` من كل البطاقات (الرئيسية/القوائم/البحث/المفضلة/العروض/المساعد) → معرض التفاصيل (الصفحة الأولى).
- **التبويبات**: دخول fade-through عند التنشيط (`_TabEntrance` في main_shell) مع حفظ حالة IndexedStack.
- **شريط التنقل**: مؤشر واحد "مسافر" (AnimatedAlign) بدل حبوب لكل زر.

## الأنماط القياسية

- **Skeletons**: كل تحميل shimmer (`ShimmerBox`/`ProductGridSkeleton`/...) — ممنوع `CircularProgressIndicator` على مستوى الشاشة.
- **Empty/Error**: `EmptyState` (يدعم `actionLabel`+`onAction`) و`ErrorView` — لا حالات مخصصة متضاربة.
- **Snackbar**: عبر `AppSnackbar` فقط.
- **Haptics**: `selectionClick` للنقرات، `lightImpact` للإرسال، `mediumImpact` للإضافات.
- **RTL**: `EdgeInsetsDirectional`/`PositionedDirectional` — لا left/right صريحة.
- **اللغة**: كل النص عبر `AppStrings` (`ref.s`) — لا عربي hardcoded في الواجهات.
- **الخط**: Cairo (UI)، ElMessiri/Cormorant (العلامة). أحجام من `AppTypography`.
- **الأنصاف**: `AppRadius` — pill واحد (999).

## قرار الهوية

التركواز أساسي (مطابق الشعار والموقع deemaalhayat.com)، والوردي (`rose`) مخصص دلالياً للعروض والتخفيضات والقلوب — يجلس بجانب التركواز في شاشة العروض كتباين مقصود، لا كصراع هوية.


## الطبقة المتقدمة (ترقية التأثيرات والأداء)

### انتقالات الصفحات
كل مسار يمر عبر `appPage()` (من `app_motion.dart`) — fade-through بمحور Z مشترك (260ms دخول / 180ms خروج، easeOutQuart + scale 0.98→1). ممنوع `builder:` العادي للمسارات الجديدة.

### الرسومات المخصصة (`core/widgets/brand_art.dart`)
- `AmbientBackground` — بقع ضوء ناعمة تنساب خلف خلفية الرئيسية (عدّاد واحد 16s + RepaintBoundary).
- `ButterflyArt` — فراشة الهوية بالرسم الخطي (الحالات الفارغة: `EmptyState(butterfly: true)`).
- `WaveDivider` — فاصل موجي زخرفي بعد قسم الهيرو.

### التفاعل
`Pressable` (`core/widgets/pressable.dart`) — تقلص 0.975 + شفافية لحظية عند الضغط؛ للبطاقات البصرية (بانرات/إطارات).

### الأداء
- ظلال الهوية (`AppColors.*Shadow`, `CartTheme.*Shadow`) محفوظة `static final` — لا إنشاء قوائم في كل build.
- كل تحميل على مستوى الشاشة shimmer — لا `CircularProgressIndicator` مركزية (audited).
- StaggerEntrance محدود بأول 8 عناصر (حماية القوائم الطويلة) + `RepaintBoundary` على كل عنصر متحرك.
- أرقام الأسعار/الإجماليات عبر `AnimatedNumber` (TweenAnimationBuilder — بلا controllers).


## طبقة التوقيع البصري (الأنيميشن المميز)

- **`Sheen`** (`core/widgets/sheen.dart`) — شريط ضوء قطري يمرّ فوق الأزرار المتدرجة دورياً (كل 3.6ث، 320ms). مطبق على: زر إتمام الشراء، زر الدخول/التسجيل الأساسي، زر مسح الباركود. معزول RepaintBoundary ويتوقف مع TickerMode.
- **شارة السلة تنبض** عند تغير العدد (PulseOnChange 1.25×).
- **أرقام العدّادات تنزلق** — stepper البطاقة (fade+scale) وstepper التفاصيل (slide) عبر AnimatedSwitcher بمدة fast.
- **النجوم تُعبَّأ تباعاً** — صفوف التقييم في تفاصيل المنتج تدخل بتتابع 12% لكل نجمة بارتداد ناعم.
- **السبلاش** فوق AmbientBackground — نفس بقع الضوء الحية للرئيسية.
