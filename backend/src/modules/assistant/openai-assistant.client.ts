import { Injectable, Logger } from "@nestjs/common";

export type AssistantGptReply = {
  reply: string;
  productIds: string[];
  suggestions: string[];
};

export type AssistantPlan = AssistantGptReply & {
  action: "talk" | "search";
  queries: string[];
  maxPrice?: number;
};

export type AssistantBrief = {
  shop: boolean;
  move: "chat" | "explain" | "more" | "switch" | "shop" | "compare" | "cheaper";
  compareIndexes?: [number, number];
  queries: string[];
  maxPrice?: number;
  kind?: string;
  concern?: string;
  moreCount?: number;
  focusIndex?: number;
  reply: string;
};

@Injectable()
export class OpenAiAssistantClient {
  private readonly logger = new Logger(OpenAiAssistantClient.name);
  private readonly apiKey = process.env.OPENAI_API_KEY ?? "";
  /** الجواب النهائي على Terra. فهم الطلب على موديل أسرع حتى الصوت ما يتأخر. */
  private readonly model = process.env.OPENAI_ASSISTANT_MODEL || "gpt-5.6-terra";
  private readonly fastModel = process.env.OPENAI_ASSISTANT_FAST_MODEL || "gpt-4.1-mini";

  get enabled() {
    return this.apiKey.length > 0;
  }

  /** يفهم القصد العراقي قبل البحث: نوع المنتج، الفائدة، والسعر، بعبارات قصيرة تلقى بالمتجر. */
  async interpret(params: {
    lang: "ar" | "en";
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    memory: string;
  }): Promise<AssistantBrief> {
    const system = params.lang === "ar"
      ? `أنتِ فضه، مستشارة المتجر. اسمج فضه مو ديمة. افهمي قصد الزبونة العراقية حتى لو غيّرت المنتج أو قالت «الثاني» أو «غير هذا».
move:
- chat إذا تسلّم بدون مشكلة تجميل وبدون شراء
- explain إذا تسأل عن منتج ظاهر (الأول=0، الثاني=1، الثالث=2) مثل الاستخدام أو السعر أو المكونات
- more إذا تريد نتائج إضافية من نفس الطلب
- cheaper إذا تريد أرخص من الظاهر
- compare إذا تقارن منتجين ظاهرين، compareIndexes مثل [0,1]
- switch إذا انتقلت لنوع منتج آخر
- shop إذا تريد شراء أو عندها مشكلة مثل التساقط أو الحبوب أو التفتيح، حتى لو سألت «ليش» أو «شنو السبب»
شعري يطيح = شامبو وتساقط. ريحة أو برفان = عطر مو سبلاش، إلا إذا قالت سبلاش. تفتيح البشرة = pigment. حبوب = acne.
queries من 1 إلى 3 عبارات قصيرة تنكتب على المنتج، عربي وإنجليزي. مثال: ["كريم تفتيح","brightening cream"]. ممنوع الجملة كاملة.
kind: perfume splash shampoo mask serum moisturizer cream cleanser sunscreen lipstick other.
concern: hairloss dry oily colored dandruff acne pigment sensitive أو null.
moreCount رقم إذا قالت كم نتيجة، وإلا null. maxPrice بالدينار أو null. «50 ألف»=50000. لا تخمّنين سعراً.
JSON فقط: {"shop":true,"move":"shop","queries":[],"maxPrice":null,"kind":"other","concern":null,"moreCount":null,"focusIndex":null,"compareIndexes":null,"reply":""}`
      : `You are Fidda, the store advisor. Your name is Fidda, not Deema. Understand the shopper's meaning.
shop=true only when she wants a product. queries are 1-3 short catalog phrases, not her full sentence.
kind is perfume|splash|shampoo|mask|serum|moisturizer|cream|cleanser|sunscreen|lipstick|other.
concern is hairloss|dry|oily|colored|dandruff|acne|pigment|sensitive or null. A beauty problem is shop, even if she asks why. maxPrice is IQD or null. "50 ألف" means 50000. Do not invent a price.
JSON only: {"shop":true,"move":"shop","queries":[],"maxPrice":null,"kind":"other","concern":null,"moreCount":null,"focusIndex":null,"reply":""}`;
    const parsed = await this.complete(system, params.history, [
      params.memory ? `الطلب السابق:\n${params.memory}` : "",
      params.message,
    ].filter(Boolean).join("\n\n"), this.model, 420);
    const kind = String(parsed.kind ?? "");
    const concern = String(parsed.concern ?? "");
    const move = String(parsed.move ?? "");
    const focus = typeof parsed.focusIndex === "number" ? parsed.focusIndex : undefined;
    return {
      shop: parsed.shop !== false && move !== "chat",
      move: move === "chat" || move === "explain" || move === "more" || move === "switch" || move === "compare" || move === "cheaper" ? move : "shop",
      compareIndexes: this.pair(parsed.compareIndexes),
      queries: Array.isArray(parsed.queries) ? parsed.queries.map((item) => String(item).trim()).filter(Boolean).slice(0, 3) : [],
      maxPrice: typeof parsed.maxPrice === "number" && parsed.maxPrice > 0 ? parsed.maxPrice : undefined,
      kind: kind && kind !== "null" ? kind : undefined,
      concern: concern && concern !== "null" ? concern : undefined,
      moreCount: typeof parsed.moreCount === "number" && parsed.moreCount > 0 ? Math.min(6, Math.round(parsed.moreCount)) : undefined,
      focusIndex: focus != null && focus >= 0 && focus <= 5 ? focus : undefined,
      reply: this.clean(String(parsed.reply ?? "")),
    };
  }

  /** يفهم الطلب مثل محادثة عادية، ويقرر إذا يحتاج بحثاً داخل المتجر. */
  async plan(params: {
    lang: "ar" | "en";
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    knownProducts: string;
    voice?: boolean;
  }): Promise<AssistantPlan> {
    const voiceNote = params.voice
      ? "الرد يُقرأ بصوت بغدادي. عامية نسائية فقط: هسه، لج، عندج، مو، أكو، ماكو. جملتان قصيرتان. ممنوع الفصحى."
      : "";
    const system = params.lang === "ar"
      ? `أنتِ فضه، صديقة ذكية تفهم العربية العراقية والإنجليزية والخلط بينهم، والأخطاء الإملائية، والقصد حتى لو ما انقال حرفياً.
لا تعتمدين على تطابق كلمات محفوظ. حلّلي المعنى.
إذا الزبونة تحكي أو تسأل عن استخدام أو مكونات أو مقارنة لمنتج موجود تحت «منتجات المحادثة»، جاوبي من تلك البيانات فقط.
action=talk وproductIds من المنتجات المعروضة فقط إذا ذكرتيها.
إذا تريد اقتراح شراء، action=search واكتبي 1 إلى 3 استعلامات بحث طبيعية (عربي أو إنجليزي) تناسب محرك المتجر. لا تخترعين منتجات في reply.
maxPrice رقم بالدينار إذا ذكرت ميزانية، وإلا null. «50 ألف» تعني 50000.
${voiceNote}
JSON فقط: {"action":"talk"|"search","reply":"...","queries":[],"maxPrice":null,"productIds":[],"suggestions":[]}`
      : `You are Fidda, a smart friend. Understand meaning, typos, and mixed Arabic/English. Do not depend on stored keywords.
If she is chatting or asking about a product already listed under known products, action=talk and answer only from that data.
If she wants to buy, action=search with 1-3 natural search queries. Do not invent products.
maxPrice is IQD or null. "50 ألف" means 50000.
JSON only: {"action":"talk"|"search","reply":"...","queries":[],"maxPrice":null,"productIds":[],"suggestions":[]}`;

    const parsed = await this.complete(system, params.history, [
      params.knownProducts ? `منتجات المحادثة:\n${params.knownProducts}` : "",
      params.message,
    ].filter(Boolean).join("\n\n"), this.fastModel);
    const action = parsed.action === "search" ? "search" : "talk";
    return {
      action,
      reply: this.clean(String(parsed.reply ?? "")),
      queries: Array.isArray(parsed.queries) ? parsed.queries.map((item) => String(item).trim()).filter(Boolean).slice(0, 3) : [],
      maxPrice: typeof parsed.maxPrice === "number" && parsed.maxPrice > 0 ? parsed.maxPrice : undefined,
      productIds: this.ids(parsed.productIds),
      suggestions: this.suggestions(parsed.suggestions),
    };
  }

  /** يوسم دفعة منتجات من نصها المكتوب فقط: النوع، الخطوة، المشاكل، وسطر فائدة قصير. */
  async tagProducts(items: Array<{ id: string; text: string }>): Promise<Array<Record<string, unknown>>> {
    const system = `You label cosmetics products for an Iraqi beauty store. Use ONLY the given text. Never invent benefits.
For each product return:
- kind: shampoo|conditioner|mask|oil|serum|cream|moisturizer|cleanser|toner|sunscreen|perfume|splash|lipstick|makeup|body|tool|other
- role: wash (shampoo, cleanser, face wash) | treat (serum, spray, tonic, ampoule, scalp lotion, spot treatment) | care (conditioner, mask, oil, cream, moisturizer) | protect (sunscreen) | other (makeup, perfume, tools)
- area: hair|skin|body|makeup|fragrance|nails|tools|other
- concerns: subset of hairloss,dandruff,dry,oily,colored,acne,pigment,sensitive,aging,frizz,dark_circles. Only if the text says it or it is clearly the product purpose.
- audience: adult|baby
- summary: one short Arabic sentence (max 90 chars) about what it does, from the text only.
JSON only: {"items":[{"id":"...","kind":"...","role":"...","area":"...","concerns":[],"audience":"adult","summary":"..."}]}`;
    const user = items.map((item) => `id=${item.id}\n${item.text}`).join("\n---\n");
    const parsed = await this.complete(system, [], user, this.fastModel, 220 + items.length * 110);
    return Array.isArray(parsed.items) ? (parsed.items as Array<Record<string, unknown>>) : [];
  }

  /** متجهات قصيرة (256) للبحث بالمعنى. */
  async embed(texts: string[]): Promise<number[][]> {
    if (!this.enabled) throw new Error("OPENAI_API_KEY is not configured");
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
        input: texts.map((text) => text.slice(0, 2000)),
        dimensions: 256,
      }),
    });
    const body = (await res.json()) as { data?: Array<{ index: number; embedding: number[] }>; error?: { message?: string } };
    if (!res.ok || !body.data) throw new Error(body.error?.message ?? `Embeddings HTTP ${res.status}`);
    return body.data.sort((a, b) => a.index - b.index).map((row) => row.embedding);
  }

  /** يعيد صياغة البحث إذا الدفعة الأولى ما قرّبت من القصد. */
  async retryQueries(params: { lang: "ar" | "en"; goal: string; tried: string[] }): Promise<string[]> {
    const system = params.lang === "ar"
      ? `اكتبي 3 عبارات بحث قصيرة مختلفة لنفس القصد، بالعربي والإنجليزي، كما تكتب على منتج تجميل. لا تكررين العبارات الفاشلة. JSON فقط: {"queries":["..."]}`
      : `Write 3 different short catalog search phrases for the same intent. Do not repeat the failed ones. JSON only: {"queries":["..."]}`;
    const parsed = await this.complete(system, [], `القصد:\n${params.goal}\n\nما نفع:\n${params.tried.join(" | ")}`, this.fastModel, 180);
    return Array.isArray(parsed.queries) ? parsed.queries.map((item) => String(item).trim()).filter(Boolean).slice(0, 3) : [];
  }

  /** يختار من نتائج المتجر فقط. أي منتج خارج القائمة يُحذف. */
  async choose(params: {
    lang: "ar" | "en";
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    catalog: string;
    voice?: boolean;
  }): Promise<AssistantGptReply> {
    const voiceNote = params.voice
      ? "الجواب يُقرأ بصوت. عامية بغدادية نسائية بجملتين: هسه، لج، عندج، هذا، مو، أكو. ممنوع: يمكنكِ، سوف، مناسب لكِ."
      : "عامية بغدادية نسائية، أربع إلى ست جمل قصيرة. ابدئي بالمشكلة ثم الخطوات بالترتيب. ممنوع: يمكنكِ، سوف، مناسب لكِ.";
    const system = params.lang === "ar"
      ? `أنتِ فضه، مستشارة تجميل بغدادية مو محرك بحث. إذا سألت عن اسمج، قوليلها فضه. هذه منتجات المتجر فقط، وكل واحد معه فائدته وسعره.
ابدئي بشرح المشكلة: ليش منتج واحد ما يكفي. بعده كل خطوة بالترتيب، شنو تسوي، وسعرها المكتوب بالدينار. إذا مكتوبة طريقة استخدام قصيرة اذكريها. أرجعي كل الخطوات في productIds.
إذا طلبت غالي، الأغلى داخل كل خطوة هو المطلوب. لا تبدلين شامبو غالي بشامبو رخيص، ولا بخاخ بشامبو ثاني.
لا تختارين شامبو أطفال لطلب تساقط، ولا سبلاش لطلب عطر، ولا منتج أغلى من السقف. لا تشخصين مرض ولا تخترعين منتج أو سعر أو مكون.
${voiceNote}
JSON فقط: {"reply":"...","productIds":["..."],"suggestions":["..."]}`
      : `You are Fidda, a beauty consultant. These are the only real store products.
If the problem needs more than one step, such as hair loss needing a shampoo plus a spray or serum, explain why one product is not enough and why each step matters. Return every step in productIds.
If she asked for something expensive, keep the higher-priced match. Never swap it for a cheaper one.
Never pick baby shampoo for hair loss, a splash for a perfume request, or a product over the budget. Mention only written prices.
JSON only: {"reply":"...","productIds":["..."],"suggestions":["..."]}`;
    const parsed = await this.complete(system, params.history, `الطلب:\n${params.message}\n\nالمنتجات:\n${params.catalog}`, this.model, 640);
    return {
      reply: this.clean(String(parsed.reply ?? "")),
      productIds: this.ids(parsed.productIds),
      suggestions: this.suggestions(parsed.suggestions),
    };
  }

  async chat(params: {
    lang: "ar" | "en";
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    productsText: string;
    context: string;
    mode?: "recommend" | "explain" | "chat";
  }): Promise<AssistantGptReply> {
    if (!this.enabled) throw new Error("OPENAI_API_KEY is not configured");

    const explain = params.mode === "explain";
    const chat = params.mode === "chat";
    const system = params.lang === "ar"
      ? `أنتِ فضه، صديقة تفهم التجميل وتعرف منتجات المتجر. اسمج فضه مو ديمة. احكي عراقي خفيف وطبيعي، مو مثل بائعة.
- ${chat ? "هذا حديث، مو طلب شراء. جاوبي بدون منتجات وبدون أسعار مخترعة." : explain ? "السؤال عن منتج محدد. اشرحي الاستخدام أو المكونات أو الفائدة من النص المعطى فقط. لا تعرضين منتجات جديدة ولا تخترعين معلومة ناقصة." : "إذا وصلت خيارات، هي مفلترة على النوع والفائدة والجمهور. اختاري منها فقط واذكري السعر. ممنوع تبديل شامبو التساقط بشامبو أطفال أو العطر بسبلاش."}
- أعيدي صياغة الحقيقة بجمل قصيرة. ممنوع أي سؤال إذا الجواب موجود.
- اسألي فقط إذا ماكو ولا خيار، وسؤال واحد قصير. لا تسألين عن نوع البشرة إذا تكدرين تقترحين خياراً آمناً.
- عربي عراقي أنثوي. اذكري الاسم والسعر بالدينار.
- suggestions جمل شراء أقصر، مو أسئلة. مثال: «مرطب أغنى» أو «خيار أرخص».
- ممنوع: كتالوج، قائمة، نظام، قاعدة، معرف.
JSON فقط: {"reply":"...","productIds":["..."],"suggestions":["..."]}`
      : `You are Fidda, a beauty advisor. Recommend first. Do not interview the customer.
- If options are provided, immediately pick 1 to 3 and explain why in two sentences. No questions.
- Ask only when there are zero options, and ask one short question.
- suggestions are shorter shopping requests, not questions.
- Never mention catalogs, lists, databases, or internal ids.
Return JSON only: {"reply":"...","productIds":["..."],"suggestions":["..."]}`;

    const user = [
      params.context ? `عن الزبونة: ${params.context}` : "",
      params.productsText
        ? `خيارات ممكن تناسب:\n${params.productsText}`
        : params.mode === "explain"
          ? ""
          : "ما لقيت خيارات واضحة تناسب كلامها.",
      `آخر رسالة:\n${params.message}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return this.complete(system, params.history, user).then((parsed) => ({
      reply: this.clean(String(parsed.reply ?? "")),
      productIds: this.ids(parsed.productIds),
      suggestions: this.suggestions(parsed.suggestions),
    }));
  }

  private async complete(
    system: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    user: string,
    model = this.model,
    maxTokens = model === this.fastModel ? 220 : 420,
  ): Promise<Record<string, unknown>> {
    if (!this.enabled) throw new Error("OPENAI_API_KEY is not configured");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          ...history.slice(-6).map((item) => ({ role: item.role, content: item.content.slice(0, 240) })),
          { role: "user", content: user },
        ],
      }),
    });

    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = body.error as { message?: string } | undefined;
      throw new Error(err?.message ?? `OpenAI HTTP ${res.status}`);
    }
    const choices = body.choices as Array<{ message?: { content?: string } }> | undefined;
    const text = choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty OpenAI response");
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(`Failed to parse assistant JSON: ${String(error)}`);
      throw error;
    }
  }

  async transcribe(audio: Buffer, mime = "audio/mp4", lang: "ar" | "en" = "ar"): Promise<string> {
    if (!this.enabled) throw new Error("OPENAI_API_KEY is not configured");
    const form = new FormData();
    const filename = mime.includes("wav") ? "voice.wav" : "voice.m4a";
    form.append("file", new Blob([new Uint8Array(audio)], { type: mime }), filename);
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe");
    form.append("language", lang === "en" ? "en" : "ar");
    form.append(
      "prompt",
      lang === "en"
        ? "Beauty shopping. Shampoo, perfume, moisturizer, serum."
        : "المتحدثة عراقية من بغداد. انسخي العامية كما قيلت ولا تحوّليها للفصحى. شلونج، أريد، شامبو تساقط، عطر، مرطب، كريم، سيروم، ألف دينار، رخيص.",
    );
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    const body = (await res.json()) as { text?: string; error?: { message?: string } };
    if (!res.ok) throw new Error(body.error?.message ?? `Transcribe HTTP ${res.status}`);
    return (body.text ?? "").trim();
  }

  /** يثبت النص بالعامية البغدادية قبل النطق حتى اللهجة تطلع من الكلام نفسه. */
  async toBaghdadi(text: string): Promise<string> {
    const source = text.trim();
    if (!source || !this.enabled) return source;
    try {
      const parsed = await this.complete(
        `حوّلي النص لعامية بغدادية نسائية قصيرة تُقرأ بصوت، كأنج تحجين ويا صديقة.
حافظي على أسماء المنتجات وكل الأرقام كما هي. جملتان كحد أقصى.
استخدمي: هسه، لج، عندج، هذا، هذي، مو، أكو، ماكو، زين.
ممنوع الفصحى مثل: يمكنكِ، سوف، هذا المنتج مناسب.
JSON فقط: {"text":"..."}`,
        [],
        source.slice(0, 500),
        this.fastModel,
      );
      const line = this.clean(String(parsed.text ?? "")).trim();
      if (!line) return source;
      const invented = [...line.matchAll(/\d{3,}/g)].some((match) => !source.includes(match[0]));
      return invented ? source : line;
    } catch (error) {
      this.logger.warn(`Baghdadi rewrite skipped: ${String(error)}`);
      return source;
    }
  }

  async speakIraqi(text: string, lang: "ar" | "en" = "ar"): Promise<Buffer> {
    if (!this.enabled) throw new Error("OPENAI_API_KEY is not configured");
    const spoken = text.trim().slice(0, 500);
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts-2025-03-20";
    try {
      return await this.speech(spoken, model, lang);
    } catch (error) {
      this.logger.warn(`Iraqi speech failed on ${model}: ${String(error)}`);
      if (model === "gpt-4o-mini-tts") throw error;
      return this.speech(spoken, "gpt-4o-mini-tts", lang);
    }
  }

  private async speech(spoken: string, model: string, lang: "ar" | "en"): Promise<Buffer> {
    const instructions = lang === "en"
      ? "Speak as a warm young woman, clear and friendly, short sentences."
      : "Speak as a young woman from Baghdad talking to a friend. Iraqi Baghdadi colloquial Arabic, not Modern Standard Arabic, not Egyptian, not Levantine, not Gulf. Feminine suffix sounds like ch: لج is lich, شلونج is shlonich. ق in everyday words is a light glottal stop. Warm, clear, natural pace, no news-anchor tone.";
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: "coral",
        input: spoken,
        instructions,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message ?? `Speech HTTP ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  private pair(value: unknown): [number, number] | undefined {
    if (!Array.isArray(value) || value.length < 2) return undefined;
    const left = Number(value[0]);
    const right = Number(value[1]);
    if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0 || left === right) return undefined;
    return [left, right];
  }

  private ids(value: unknown) {
    return Array.isArray(value) ? value.map((id) => String(id)).filter(Boolean).slice(0, 3) : [];
  }

  private suggestions(value: unknown) {
    return Array.isArray(value) ? value.map((item) => this.clean(String(item))).filter(Boolean).slice(0, 2) : [];
  }

  private clean(text: string) {
    return text
      .replace(/كتالوج|قائمة المنتجات|قاعدة البيانات|product\s*id|catalog|database/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
}
