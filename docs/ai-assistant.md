# المساعد الذكي للتسوّق — Alhayaa AI Shopping Assistant

مساعد تسوّق شخصي للعملاء في تطبيق ديمة الحياة: يفهم العربية واللهجة العراقية والإنجليزية، يتذكّر المحادثة، يبحث في الكتالوج الحقيقي بأدوات آمنة، يتحقق من كل ادعاء تجاري قبل الرد، ويعرض بطاقات منتجات قابلة للإضافة للسلة.

## المعمارية

```
Flutter chat (RTL + SSE streaming)
  ↓ POST /api/v1/assistant/chat | /chat/stream
AssistantService (orchestrator: fast-path, caps, throttle)
  ├─ TurnPlanner  [AI_FAST_MODEL, strict JSON]
  │    intent · entities · budget · references("الثاني") · searchQueries
  ├─ ConversationService (AiConversation.state + summary + messages)
  ├─ Agent loop [AI_PRIMARY_MODEL, tool-calling, ≤ AI_MAX_TOOL_ITERATIONS]
  │    → ToolRegistry (9 أدوات بعقود JSON صارمة)
  │        → CatalogSearchService:
  │            exact (barcode/SKU/id) → lexical (searchText + pg_trgm)
  │            → semantic (embeddings cosine in-memory) → hard filters
  │            → RankingService → diversity
  ├─ GroundingService (deterministic: كل سعر/مخزون من نتائج الأدوات فقط)
  └─ ResponseComposer (بث النص النهائي باللهجة المناسبة)
       → AssistantResponse مهيكلة (نوع + بطاقات + quickReplies + actions)
```

المساعد لا يلمس قاعدة البيانات مباشرة — كل وصول عبر أدوات مُتحقَّق منها، والموديل لا يولّد SQL إطلاقًا.

## نقاط النهاية

| Endpoint | Auth | الوصف |
|---|---|---|
| `POST /api/v1/assistant/chat` | اختياري (Bearer أو guestKey) | رد كامل JSON |
| `POST /api/v1/assistant/chat/stream` | اختياري | SSE: `meta/delta/final/error` |
| `GET /api/v1/assistant/conversations` | مستخدم مسجّل | قائمة محادثاته |
| `GET /api/v1/assistant/conversations/:id/messages` | المالك | سجل الرسائل |
| `POST /api/v1/assistant/messages/:id/feedback` | المالك | 👍/👎 + ملاحظة |
| `GET /api/v1/assistant/admin/overview?days=30` | ADMIN+ | تجميعات التحليلات |

سلة المشروع client-side بالكامل، لذلك إضافة للسلة تعود كـ `actions:[{type:"ADD_TO_CART"}]` ينفّذها التطبيق عبر `CartNotifier` ويؤكدها المساعد في الدور التالي.

## التكوين (env)

```
AI_ASSISTANT_ENABLED=1            # 0 يعطل المساعد
OPENAI_API_KEY=...                # مطلوب — بدونه يعمل الوضع المتدهور (بحث معجمي فقط)
AI_PRIMARY_MODEL=gpt-5.6-terra    # حلقة الأدوات والصياغة
AI_FAST_MODEL=gpt-5.4-mini        # فهم الدور (planner)
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_MAX_TOOL_ITERATIONS=4
AI_REQUEST_TIMEOUT_MS=45000
AI_RETRIEVAL_LIMIT=24
AI_ASSISTANT_THROTTLE_PER_MIN=15  # حد مخصص أشد من العام
AI_DAILY_USER_MESSAGE_CAP=120
AI_DEBUG=0                        # مع 1: ?debug=1 للمدراء يرجع trace كامل
```

## البيانات

- **جداول جديدة**: `AiConversation` (state JSON + summary)، `AiMessage` (payload مهيكل + feedback)، `AiUsageLog` (طلب/توكنز/تكلفة/أخطاء)، `ProductEmbedding` (متجه base64 float32 + docHash).
- **عمود جديد**: `Product.searchText` — مستند معجمي مُطبَّع (تشكيل/همزات/أرقام عربية) تتم صيانته تلقائيًا عند كل كتابة منتج، مع فهرس GIN trigram (`pg_trgm`؛ وإن تعذر التمديد يتراجع البحث إلى contains مُطبَّع تلقائيًا).

## التهيئة الأولى (بعد الـ migration)

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx tsx scripts/assistant-backfill-searchtext.ts
OPENAI_API_KEY=... docker compose exec api npx tsx scripts/assistant-backfill-embeddings.ts
```

الـ embeddings تتحدث ذاتيًا لاحقًا: أي منتج يتغير يُعاد تضمينه خلفيًا عند أول بحث بعده (docHash refresh)، والفشل يُسقط البحث دلاليًا إلى المعجمي بلا انقطاع.

## التقييم

```bash
# ضد بيئة حية (بعد النشر):
BASE_URL=https://deemaalhayat.com npm run eval:assistant -- --tag=eval-report.md

# فئة أو سيناريوهات محددة:
BASE_URL=http://localhost:3000 npm run eval:assistant -- --category=budget
BASE_URL=... npm run eval:assistant -- --only=gold_001,ref_001
```

- **120 سيناريو** في `scripts/assistant-eval/scenarios/*.json` تغطي: الاكتشاف، الميزانية، البراندات، الاستبعاد، المتابعات، المراجع ("الثاني")، المقارنات، الباركود، الأخطاء الإملائية، اللهجة العراقية، المحادثات الذهبية، النتائج الفارغة، اختبارات الهلوسة، وحقن الـ prompts.
- **Assertions حتمية** (`assertions.ts`): رضا الميزانية من الأسعار المرجعة، استبعاد البراندات، دقة الأسعار ضد الأدوار السابقة (حل المراجع)، منع تسرب العلامات الداخلية، الصدق عند الفراغ.
- بوابة النجاح: **≥85%** وإلا يفشل الأمر بـ exit code — للتشغيل في CI.
- `mock-server.ts` سيرفر اختبار للمنظومة نفسها بلا LLM.

## الاختبارات

```bash
npm test          # vitest — 36 اختبار وحدة: التطبيع، المبالغ، الحالة، المراجع، grounding، محرك الـ eval
npm run lint      # tsc --noEmit
npm run build
```

## قرارات تصميمية بارزة

1. **OpenAI Chat Completions** بدل الـ SDK: نفس نمط المشروع (fetch مباشر)، مع retry/backoff للأخطاء العابرة وstreaming عبر SSE.
2. **بث مرحلي آمن**: الأدوات تُنفَّذ أولًا ثم يُبثّ النص النهائي — لا يرى المستخدم جملة ثم يُكتشف خطؤها بعد فحص المخزون.
3. **مرجعيات مرقمة دائمة**: `state.lastRecommendationIds` يحفظ ما رآه المستخدم فعليًا بالترتيب، فيُحلّ "الثاني" بلا بحث جديد.
4. **قيد صارم مقابل تفضيل**: `preferences[].hard` — الميزانية والاستبعاد قيود تُطبق في SQL، و"خفيف/حلو" إشارات ترتيب فقط.
5. **Degradation كامل**: بلا مفتاح OpenAI → بحث معجمي بردود قوالب؛ بلا pg_trgm → contains مُطبَّع؛ بلا embeddings → معجمي فقط.
6. **حقن الـ prompts**: كل نص غير موثوق يُغلَّف بـ `DATA_..._START/END` ويمنع الـ composer اعتماده كتعليمات.

## البنية

```
src/modules/assistant/
  assistant.service.ts         # المنسّق
  assistant.controller.ts      # REST + SSE + throttle
  assistant.types.ts           # العقد المشتركة
  ai/                          # AIProvider + OpenAIProvider + config
  prompts/prompts.ts           # v1 مُصدَّرة (core/planner/policy/style/safety)
  conversation/                # الحالة + المراجع + الملخّص
  agent/                       # planner + grounding + response builder
  tools/                       # ToolRegistry (العقود + التنفيذ)
  retrieval/                   # exact/lexical/semantic/ranking/cards
  text/                        # تطبيع عربي + عملة + brand aliases
  observability/               # AiUsageLog + admin overview
mobile-app/lib/features/assistant/   # شاشة المحادثة + SSE + تنفيذ السلة
```

## ترقية v2 (2026-10-01)

### قدرات جديدة
- **أدوات الحساب** (5 جديدة، المجموع 14): `getMyOrders` / `getOrderDetails` / `getLoyaltyStatus` / `getProductReviews` / `prepareReorder` — أسئلة "وين طلبي"، "شكد نقاطي"، "عيد لي طلب أمس" تُجاب من قاعدة البيانات الحقيقية، وإعادة الطلب تُجهّز عدة `ADD_TO_CART` للسلة العميل مع ذكر الأصناف المتوقفة بصدق.
- **نوايا جديدة**: `ORDER_STATUS`, `REORDER`, `LOYALTY_QUERY` في الـ planner والـ prompts (PROMPT_VERSION=v2) + نوع رد `ORDER_INFO` مع `orders[]` (بطاقات طلبات).
- **ذاكرة طويلة المدى**: جدول `AiUserMemory` (ownerKey/guest-safe) — خدمة `memory/memory.service.ts` تُنقّي التفضيلات المتكررة (evidence ≥ 2) والبراندات المفضلة/المستبعدة والميزانية المعتادة وتحقنها كخلفية تخصيص (ليست قيوداً صارمة). نقاط: `GET /assistant/memory` و`POST /assistant/memory/clear`.
- **سلة الروتين/الهدية**: فهم `basketRoles` عندما يكون scope=total — بحث لكل دور ومجموع ضمن الميزانية الإجمالية، مع كتابة `state.basket`.
- **سياق السلة العميل**: حقل `cart` اختياري في `ChatRequestDto` يحقن `CART_CONTENTS` للوكيل.
- **عناوين المحادثات**: توليد عنوان عربي قصير بعد أول تبادل (fast model) لسجل المحادثات.

### تحسينات جودة
- تفضيلات planner الرخوة (soft) تمرر الآن إلى الترتيب `ranking.softPreferences` بدل إهمالها.
- الملخّم يطوي الملخص السابق بدل إعادة البناء من الصفر.
- `RankingService` بلا حالة مشتركة بين الطلبات (كان `cachedFacts` مشتركاً).
- `debug` محصور بأدوار ADMIN/SUPER_ADMIN في الـ controller.
- حدث SSE جديد `status` ("أفهم طلبك…"، "أدور بالكتالوج…") أثناء تنفيذ الأدوات.

### نقاط نهاية أدمن جديدة
- `GET /assistant/admin/conversations?take&intent&feedback&days` — قائمة محادثات مع إحصاءات تقييم.
- `GET /assistant/admin/conversations/:id` — النص الكامل مع payloads والتقييمات.

### تطبيق الموبايل
- شاشة سجل المحادثات `assistant_history_screen.dart` + استعادة آخر محادثة تلقائياً بعد إغلاق التطبيق (المعرف في SharedPreferences).
- زر "للسلة" ظاهر على كل بطاقة منتج داخل الشات + SnackBar تأكيد عند تنفيذ إجراءات الخادم.
- بطاقات طلبات في الشات مع شريط حالة → تفتح شاشة تفاصيل الطلب.
- زر "اسأل المساعد عن هذا المنتج" في صفحة المنتج (يمرر `screen.productId` — كان الحقل ميتاً).
- مؤشر حالة أثناء البحث، إعادة محاولة للرسائل الفاشلة، اقتراحات مترجمة EN/AR، deeplink `/assistant`.

### لوحة الأدمن (admin-desktop)
- صفحة `/assistant`: بطاقات إحصاء (رسائل، محادثات، تكلفة تقديرية، زمن، تقييمات، أخطاء) + توزيع النوايا + بحث بلا نتيجة + جدول محادثات مع Drawer عارض النص الكامل وفلتر 👎 لتدقيق الجودة.

### التقييم
- 23 سيناريو جديداً: orders(6), loyalty(3), reorder(4), basket(6), memory(4) — مع سلوكيات mock مقابلة. البوابة تبقى ≥85%.

### البنية (إضافة)
```
src/modules/assistant/memory/   # الذاكرة طويلة المدى + اختباراتها
prisma/migrations/20261001120000_ai_assistant_upgrade/
mobile-app/lib/features/assistant/assistant_history_screen.dart
admin-desktop/app/(admin)/assistant/ + components/assistant/
```

## ترقية v3 — وكيل أذكى + تطور مستمر + تصميم مميز (2026-10-01)

### ذكاء الوكيل
- **فهم الكتالوج كاملاً**: خدمة `retrieval/catalog-knowledge.service.ts` تبني خريطة المتجر (أقسام بعدد المنتجات، براندات، الأكثر مبيعاً، مدى الأسعار، مشاكل البشرة) مُخزّنة مؤقتاً 10 دقائق وتُحقن كـ `CATALOG_MAP` في الـ planner وحلقة الوكيل — استعلامات أدق وبحث عن أقسام غير موجودة صفر.
- **أداتان جديدتان** (المجموع 16): `getBestsellers` (الأكثر مبيعاً إجمالاً أو بقسم) و`getSkinGuidance` (دليل مشاكل البشرة من `SkinConcern` مع منتجات مرتبطة) لإرشاد العناية المبني على بيانات المتجر.
- **prompts v3** بسياسة `QUALITY_BAR`: سبب شخصي لكل توصية، تنويع فعلي (اقتصادي/متواسط/مميز)، وخطوة تالية طبيعية واحدة بعد كل اقتراح.

### التعلم المستمر (يتطور باستمرار)
- جدول `AiLesson` + خدمة `learning/lessons.service.ts`: تعدين دروس جودة من الردود المقيمة 👎 (نموذج خفيف يستخرج ≤5 دروس سلوكية قصيرة)، الدروس المتكررة تزيد `evidence`، تُحقن كـ `LESSONS_LEARNED` في كل رد.
- إدارة كاملة للأدمن: `GET/POST /assistant/admin/lessons`، `POST /assistant/admin/lessons/mine`، `PATCH /assistant/admin/lessons/:id` + تبويب "الدروس المتعلّمة" في اللوحة (تعدين يدوي، إضافة، تفعيل/إيقاف).

### توجيه الموديلات (ممتاز ورخيص)
- `AI_LIGHT_MODEL` جديد (افتراضي `gpt-5.4-mini` — أرخص ~3× من الفئة الرائدة): النوايا البسيطة (سعر/حالة طلب/نقاط/مفضلة/متابعة/دردشة) تعمل عليه بالكامل؛ الاستكشاف والمقارنة والروتينات تبقى على الرائد `gpt-5.6-terra`.
- تكلفة تقديرية لكل موديل حسب فئته (`estimateCostUsd`) بدل سعر واحد للجميع.

### ترحيب شخصي (بدون LLM — مجاني)
- `GET /assistant/welcome` + خدمة `welcome/welcome.service.ts`: تحية حسب وقت اليوم + الذاكرة ("أتذكر إن بشرتك دهنية وتحب غارنييه") + عدد العروض الحالية + chips مقترحة مخصصة.

### تصميم الموبايل المميز
- شخصية **"ديمة"**: ترويسة متدرجة مع أفاتار نابض متوهج، بطاقة ترحيب متدرجة تحمل التحية الشخصية، شبكة بطاقات اقتراح غنية (أيقونة + عنوان + وصف) بدل الـ chips المسطحة.
- فقاعات متدرجة للمستخدم بظل ملون، ظلال ناعمة لبطاقات المنتجات/الطلبات، زر إرسال متوهج، حركات دخول (fade+slide) لكل رسالة، وردود فعل لمسية (haptics).
