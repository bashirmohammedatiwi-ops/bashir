/**
 * تصحيح تسميات ووصف منتجات ilove — الدفعة الثانية.
 * Usage: npx tsx scripts/fix-ilove-batch2-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const S = {
  tonka: "\u0641\u0648\u0644 \u0627\u0644\u062a\u0648\u0646\u0643\u0627 \u0648\u0627\u0644\u0645\u0631",
  rose: "\u0627\u0644\u0648\u0631\u062f \u0648\u0632\u064a\u062a \u0627\u0644\u0623\u0631\u063a\u0627\u0646",
  bergamot: "\u0627\u0644\u0628\u0631\u063a\u0627\u0645\u0648\u062a \u0648\u0627\u0644\u0623\u0639\u0634\u0627\u0628 \u0627\u0644\u0628\u062d\u0631\u064a\u0629",
  lime: "\u0627\u0644\u0644\u064a\u0645\u0648\u0646 \u0648\u0627\u0644\u0632\u0646\u062c\u0628\u064a\u0644 \u0648\u0627\u0644\u0647\u064a\u0644",
  sleep: "\u0627\u0644\u062e\u0632\u0627\u0645\u0649 \u0648\u0627\u0644\u0628\u0627\u0628\u0648\u0646\u062c",
};
const NATURALS = "\u0646\u0627\u062a\u0634\u0631\u0627\u0644\u0632";

type FixInput = {
  barcode: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

function handCream(nameArScent: string, nameEnScent: string, scentAr: string, scentEn: string): Pick<FixInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: `آي لوف - كريم ترطيب اليدين برائحة ${scentAr} 100 مل`,
    nameEn: `I Love - Naturals ${nameEnScent} Hand Cream 100 ml`,
    descriptionAr:
      `كريم ترطيب لليدين والأظافف من خط ${NATURALS} الطبيعي من آي لوف، برائحة ${scentAr}، يساعد على ترطيب اليدين الجافة وتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّم بزيت جوز الهند العضوي وزبدة الشيا وبروفيتامين B5.\n• غني بالزيوت العطرية الطبيعية.\n• تركيبة ناعمة سريعة الامتصاص.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على اليدين ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Moisturising hand cream from the I Love Naturals collection with a ${scentEn} scent. Helps hydrate dry hands and leave them soft and delicately fragranced.\n\n` +
      `• 98% naturally derived ingredients.\n• Enriched with organic coconut oil, shea butter and pro-vitamin B5.\n• Infused with essential oils.\n• Lightweight, fast-absorbing formula.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
  };
}

function handWash(nameArScent: string, nameEnScent: string, scentAr: string, scentEn: string): Pick<FixInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: `آي لوف - صابون سائل لليدين برائحة ${scentAr} 500 مل`,
    nameEn: `I Love - Naturals ${nameEnScent} Hand Wash 500 ml`,
    descriptionAr:
      `صابون سائل لليدين من خط ${NATURALS} الطبيعي من آي لوف، برائحة ${scentAr}، ينظف اليدين بلطف دون تجفيفها ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• منظّفات نباتية وبروفيتامين B5.\n• رغوة كريمية ترطّب وتنعّم اليدين.\n• غني بالزيوت العطرية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُفرك على اليدين الرطبة لمدة 20 ثانية ثم يُشطف بالماء.`,
    descriptionEn:
      `Liquid hand wash from the I Love Naturals collection with a ${scentEn} scent. Gently cleanses hands without drying the skin.\n\n` +
      `• 98% naturally derived ingredients.\n• Plant-based cleansers and pro-vitamin B5.\n• Moisturising lather leaves hands silky smooth.\n• Rich in essential oils.\n• Vegan and made in the UK.\n• Apply to wet hands, lather for 20 seconds, then rinse.`,
  };
}

function lotion(nameArScent: string, nameEnScent: string, scentAr: string, scentEn: string): Pick<FixInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: `آي لوف - لوشن لليدين والجسم برائحة ${scentAr} 500 مل`,
    nameEn: `I Love - Naturals ${nameEnScent} Hand & Body Lotion 500 ml`,
    descriptionAr:
      `لوشن ترطيب لليدين والجسم من خط ${NATURALS} الطبيعي من آي لوف، برائحة ${scentAr}، يُرطّب البشرة ويتركها ناعمة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• مدعّم بزيت جوز الهند العضوي وزبدة الشيا وبروفيتامين B5.\n• مناسب للبشرة الحساسة.\n• غني بالزيوت العطرية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجلد ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      `Hand and body lotion from the I Love Naturals collection with a ${scentEn} scent. Moisturises skin and leaves it soft and delicately fragranced.\n\n` +
      `• 98% naturally derived ingredients.\n• Enriched with organic coconut oil, shea butter and pro-vitamin B5.\n• Suitable for sensitive skin.\n• Infused with essential oils.\n• Vegan and made in the UK.\n• Apply generously and massage until absorbed.`,
  };
}

function bodyWash(nameArScent: string, nameEnScent: string, scentAr: string, scentEn: string): Pick<FixInput, "nameAr" | "nameEn" | "descriptionAr" | "descriptionEn"> {
  return {
    nameAr: `آي لوف - غسول جسم برائحة ${scentAr} 500 مل`,
    nameEn: `I Love - Naturals ${nameEnScent} Body Wash 500 ml`,
    descriptionAr:
      `غسول جسم من خط ${NATURALS} الطبيعي من آي لوف، برائحة ${scentAr}، ينظف البشرة بلطف ويُبقيها مرطبة ومعطرة.\n\n` +
      `• يحتوي على 98% مكونات طبيعية المنشأ.\n• منظّفات نباتية وبروفيتامين B5.\n• رغوة فاخرة تزيل الشوائب دون تجفيف البشرة.\n• غني بالزيوت العطرية.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُوزّع على الجسم الرطب ثم يُشطف بالماء.`,
    descriptionEn:
      `Body wash from the I Love Naturals collection with a ${scentEn} scent. Gently cleanses and moisturises the skin.\n\n` +
      `• 98% naturally derived ingredients.\n• Plant-based cleansers and pro-vitamin B5.\n• Luxurious lather removes impurities without drying.\n• Rich in essential oils.\n• Vegan and made in the UK.\n• Apply to wet skin, lather, then rinse.`,
  };
}

const FIXES: FixInput[] = [
  { barcode: "5060849630146", ...handCream(`ب${S.tonka}`, "Tonka Bean & Myrrh", S.tonka, "tonka bean and myrrh") },
  { barcode: "5060849630092", ...handCream(`ب${S.rose}`, "Rose & Argan", S.rose, "rose and argan") },
  { barcode: "5060849630122", ...handCream(`ب${S.lime}`, "Lime, Ginger & Cardamom", S.lime, "lime, ginger and cardamom") },
  { barcode: "5060849630108", ...handCream(`ب${S.bergamot}`, "Bergamot & Seaweed", S.bergamot, "bergamot and seaweed") },
  { barcode: "5060351549882", ...handWash(`ب${S.lime}`, "Lime, Ginger & Cardamom", S.lime, "lime, ginger and cardamom") },
  { barcode: "5060351549905", ...handWash(`ب${S.tonka}`, "Tonka Bean & Myrrh", S.tonka, "tonka bean and myrrh") },
  { barcode: "5060351549868", ...handWash(`ب${S.bergamot}`, "Bergamot & Seaweed", S.bergamot, "bergamot and seaweed") },
  { barcode: "5060351549851", ...handWash(`ب${S.rose}`, "Rose & Argan", S.rose, "rose and argan") },
  { barcode: "5060351549981", ...lotion(`ب${S.bergamot}`, "Bergamot & Seaweed", S.bergamot, "bergamot and seaweed") },
  { barcode: "5060351549974", ...lotion(`ب${S.rose}`, "Rose & Argan", S.rose, "rose and argan") },
  { barcode: "5060849630009", ...lotion(`ب${S.lime}`, "Lime, Ginger & Cardamom", S.lime, "lime, ginger and cardamom") },
  { barcode: "5060849630023", ...lotion(`ب${S.tonka}`, "Tonka Bean & Myrrh", S.tonka, "tonka bean and myrrh") },
  { barcode: "5060351549745", ...bodyWash(`ب${S.bergamot}`, "Bergamot & Seaweed", S.bergamot, "bergamot and seaweed") },
  { barcode: "5060351549769", ...bodyWash(`ب${S.lime}`, "Lime, Ginger & Cardamom", S.lime, "lime, ginger and cardamom") },
  { barcode: "5060351549738", ...bodyWash(`ب${S.rose}`, "Rose & Argan", S.rose, "rose and argan") },
  { barcode: "5060351549783", ...bodyWash(`ب${S.tonka}`, "Tonka Bean & Myrrh", S.tonka, "tonka bean and myrrh") },
  {
    barcode: "5060849630375",
    nameAr: "آي لوف - زبدة جسم للنوم والاسترخاء 300 مل",
    nameEn: "I Love - Wellness Sleep Body Butter 300 ml",
    descriptionAr:
      `زبدة جسم غنية من مجموعة ويلنس للنوم من آي لوف، برائحة ${S.sleep} المهدئة، تُغذّي البشرة وتتركها ناعمة كالحرير.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّمة بزيت \u0627\u0644\u0623\u0641\u0648\u0643\u0627\u062f\u0648 \u0648\u062c\u0648\u0632 \u0627\u0644\u0647\u0646\u062f \u0648\u0632\u0628\u062f\u0629 \u0627\u0644\u0634\u064a\u0627 \u0648\u0632\u0628\u062f\u0629 \u0627\u0644\u0643\u0627\u0643\u0627\u0648.\n• تركيبة غنية وكريمية للترطيب العميق.\n• نباتية ومصنوعة في المملكة المتحدة.\n• مثالية قبل النوم للاسترخاء.\n• يُوزّع على الجسم ويُدلّك حتى الامتصاص.`,
    descriptionEn:
      "Rich body butter from the I Love Wellness Sleep collection with a calming lavender and chamomile aroma. Nourishes skin and leaves it silky smooth.\n\n• 99% naturally derived ingredients.\n• Enriched with avocado and coconut oils, shea and cocoa butter.\n• Rich, creamy formula for deep moisturising.\n• Vegan and made in the UK.\n• Ideal before bedtime to unwind.\n• Apply generously and massage until absorbed.",
  },
  {
    barcode: "5060849630498",
    nameAr: "آي لوف - زيت استحمام وجسم للنوم 125 مل",
    nameEn: "I Love - Wellness Sleep Bath & Body Oil 125 ml",
    descriptionAr:
      `زيت استحمام وجسم من مجموعة ويلنس للنوم من آي لوف، برائحة ${S.sleep}، يُهدّئ الجسم والعقل استعداداً للنوم.\n\n` +
      `• زيوت عطرية طبيعية 100%.\n• يحتوي على زيت الخزامى والبابونج.\n• يُستخدم في الحمام أو يُطبّق مباشرة على الجلد.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة ناعمة ومعطرة.\n• أضف 5–10 قطرات للماء الدافئ أو دلّك على الجلد.`,
    descriptionEn:
      "Bath and body oil from the I Love Wellness Sleep collection with lavender and chamomile essential oils. Prepares body and mind for a restful night's sleep.\n\n• 100% natural essential oils.\n• Infused with lavender and chamomile.\n• Use in the bath or apply directly to skin.\n• Vegan and made in the UK.\n• Leaves skin soft and delicately scented.\n• Add 5–10 drops to warm bath water or massage into skin.",
  },
  {
    barcode: "5060849630399",
    nameAr: "آي لوف - بخاخ وسادة للنوم 125 مل",
    nameEn: "I Love - Wellness Sleep Pillow Mist 125 ml",
    descriptionAr:
      `بخاخ وسادة من مجموعة ويلنس للنوم من آي لوف، برائحة ${S.sleep} المهدئة، يُنشّئ أجواء نوم هادئة ومريحة.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• زيوت عطرية طبيعية من الخزامى والبابونج.\n• نباتي ومصنوع في المملكة المتحدة.\n• يُرش على الوسادة قبل النوم.\n• يُساعد على الاسترخاء والهدوء.\n• يُرش من مسافة 20–30 سم.`,
    descriptionEn:
      "Pillow mist spray from the I Love Wellness Sleep collection with a calming lavender and chamomile scent. Creates a relaxing bedtime atmosphere.\n\n• 99% naturally derived ingredients.\n• Infused with natural lavender and chamomile essential oils.\n• Vegan and made in the UK.\n• Spray onto pillow before sleep.\n• Helps unwind and relax.\n• Spray from 20–30 cm distance.",
  },
  {
    barcode: "5060849630337",
    nameAr: "آي لوف - مستحضر استحمام للنوم 500 مل",
    nameEn: "I Love - Wellness Sleep Bath Soak 500 ml",
    descriptionAr:
      `مستحضر استحمام من مجموعة ويلنس للنوم من آي لوف، برائحة ${S.sleep}، يُهدّئ الجسم والعقل ويُنعّم البشرة أثناء الاستحمام.\n\n` +
      `• يحتوي على 99% مكونات طبيعية المنشأ.\n• مدعّم بمستخلص الصبار والبابونج والخزامى.\n• يُصب تحت ماء الحمام الجاري للاسترخاء.\n• نباتي ومصنوع في المملكة المتحدة.\n• يترك البشرة نظيفة وناعمة ومعطرة.\n• يُصب الكمية المناسبة تحت ماء الحمام الجاري.`,
    descriptionEn:
      "Bath soak from the I Love Wellness Sleep collection with lavender and chamomile. Relaxes body and mind and leaves skin clean, soft and delicately scented.\n\n• 99% naturally derived ingredients.\n• Enriched with aloe vera, chamomile and lavender extract.\n• Pour under running bath water to unwind.\n• Vegan and made in the UK.\n• Leaves skin beautifully scented and silky soft.\n• Add the desired amount under running water.",
  },
];

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? json.accessToken ?? "";
  if (!token) throw new Error("No access token");
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: { message?: string } })?.error?.message ??
      (json as { message?: string })?.message ??
      res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function main() {
  console.log(`Fixing ${FIXES.length} products...\n`);
  await login();

  const pr = await fetch(`${API_BASE}/products?brandId=ilove&status=all&limit=100`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const items = ((await pr.json()) as { data: Array<{ id: string; barcode?: string; sku?: string }> }).data;

  let ok = 0;
  let fail = 0;

  for (const fix of FIXES) {
    const p = items.find((x) => x.barcode === fix.barcode || x.sku === fix.barcode);
    if (!p) {
      console.log(`✗ ${fix.barcode}: not found`);
      fail += 1;
      continue;
    }
    try {
      await api(`/products/${p.id}`, "PATCH", {
        nameAr: fix.nameAr,
        nameEn: fix.nameEn,
        descriptionAr: fix.descriptionAr,
        descriptionEn: fix.descriptionEn,
      });
      console.log(`✓ ${fix.barcode}`);
      console.log(`  ${fix.nameAr}`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      fail += 1;
      console.log(`✗ ${fix.barcode}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n--- Summary ---\nFixed: ${ok}\nFailed: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
