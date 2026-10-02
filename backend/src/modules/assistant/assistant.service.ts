import { Injectable, Logger } from "@nestjs/common";
import { rewriteProductMediaUrls } from "../../common/media-url.util";
import { PrismaService } from "../../common/prisma.service";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { RedisCacheService } from "../../common/redis-cache.service";
import { findAssistantProductIds } from "../../common/smart-search";
import { QueryProductsDto } from "../catalog/dto/product.dto";
import { ProductsService } from "../catalog/products.service";
import { AssistantGuidesService } from "./assistant-guides.service";
import { AssistantInsightsService, TurnOutcome } from "./assistant-insights.service";
import { AssistantProfileService } from "./assistant-profile.service";
import { AssistantCatalogService } from "./assistant-catalog.service";
import { AssistantChatDto } from "./dto/assistant-chat.dto";
import {
  adviceBrief,
  applyBrief,
  askedStep,
  broadenQueries,
  consultantReply,
  consultPicks,
  isRoutineUsage,
  kindFits,
  planAgent,
  preferCompanyPick,
  productRole,
  rankMatches,
  replaceStep,
  routinePlan,
  scoredMatches,
  searchQueries,
  stepAnswer,
  stepLabel,
  stepToReplace,
  turnFromBrief,
  usageReply,
  wantsRoutine,
} from "./intelligence/agent";
import { clarify, isNameQuestion, nameReply } from "./intelligence/clarify";
import {
  applyProfile,
  CustomerProfile,
  describeProfile,
  extractProfileFacts,
  hasFacts,
  isForgetRequest,
  isMemoryQuestion,
  learnedReply,
  profileAnswersClarify,
  profileSummary,
  triggersSensitivity,
} from "./intelligence/profile";
import { guideNotes, hiddenProductIds, promotedProductIds, steerPicks } from "./intelligence/guides";
import { acceptsProduct, canonicalBrand, priceBounds, priceTierOf, productSwitch, understand } from "./intelligence/understand";
import { Concern, emptyState, ProductKind, ShoppingState, ShownProduct, Turn } from "./intelligence/types";
import { AssistantBrief, OpenAiAssistantClient } from "./openai-assistant.client";

type CatalogRow = ShownProduct & {
  nameAr: string;
  nameEn: string;
  brand: string;
  category: string;
  price: number;
  blurb: string;
};

const KINDS = new Set<ProductKind>(["perfume", "splash", "shampoo", "mask", "serum", "moisturizer", "cream", "cleanser", "sunscreen", "lipstick", "other"]);
const CONCERNS = new Set<Concern>(["hairloss", "dry", "oily", "colored", "dandruff", "acne", "pigment", "sensitive"]);

const CONCERN_WORDS: Record<Concern, string> = {
  hairloss: "hairloss, hair loss, anti hair fall, تساقط الشعر، تقوية الجذور",
  dandruff: "dandruff, anti dandruff scalp, قشرة",
  dry: "dry, hydration, moisture, جفاف، ترطيب",
  oily: "oily, sebum control, دهون",
  colored: "colored, color protect, شعر مصبوغ",
  acne: "acne, blemishes, spots, حبوب",
  pigment: "pigment, dark spots, brightening, تفتيح، بقع",
  sensitive: "sensitive, soothing, بشرة حساسة",
};

const KIND_WORDS: Partial<Record<ProductKind, string>> = {
  shampoo: "shampoo شامبو",
  mask: "hair mask ماسك",
  serum: "serum سيروم",
  cream: "cream كريم",
  moisturizer: "moisturizer مرطب",
  cleanser: "cleanser face wash غسول",
  sunscreen: "sunscreen spf واقي شمس",
  perfume: "perfume eau de parfum عطر",
  splash: "body splash سبلاش",
  lipstick: "lipstick روج",
};

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly sessions = new Map<string, ShoppingState>();
  private readonly cache = new Map<string, { at: number; rows: CatalogRow[] }>();

  constructor(
    private readonly products: ProductsService,
    private readonly gpt: OpenAiAssistantClient,
    private readonly redis: RedisCacheService,
    private readonly prisma: PrismaService,
    private readonly guides: AssistantGuidesService,
    private readonly insights: AssistantInsightsService,
    private readonly profiles: AssistantProfileService,
    private readonly catalog: AssistantCatalogService,
  ) {}

  async voice(userId: string, audio: Buffer, mime: string, lang: "ar" | "en") {
    const transcript = await this.gpt.transcribe(audio, mime, lang);
    if (!transcript) {
      const reply = lang === "ar" ? "ما سمعتج. احكي أقرب للمايك." : "I couldn't hear that. Speak closer to the mic.";
      return { transcript: "", reply, products: [], suggestions: [], audioBase64: await this.speechOrEmpty(reply, lang) };
    }
    const result = await this.chat(userId, { message: transcript, lang, voice: true });
    const spoken = lang === "ar" ? await this.gpt.toBaghdadi(String(result.reply || "")) : String(result.reply || "");
    const audioBase64 = await this.speechOrEmpty(spoken, lang);
    return { ...result, reply: spoken || result.reply, transcript, audioBase64 };
  }

  private async speechOrEmpty(text: string, lang: "ar" | "en") {
    try {
      const speech = await this.gpt.speakIraqi(text, lang);
      return speech.toString("base64");
    } catch {
      return "";
    }
  }

  async chat(userId: string, dto: AssistantChatDto) {
    const started = Date.now();
    const { outcome, ...result } = await this.respond(userId, dto);
    const state = await this.readSession(userId);
    const productIds = (result.products as Array<{ id?: unknown }>).map((item) => String(item?.id ?? "")).filter(Boolean);
    const turnId = await this.insights.record({
      userId,
      message: dto.message.trim(),
      reply: String(result.reply ?? ""),
      outcome: outcome ?? (productIds.length ? "products" : "reply"),
      kind: state.kind,
      concern: state.concern,
      productIds,
      latencyMs: Date.now() - started,
    });
    return { ...result, turnId };
  }

  private async respond(userId: string, dto: AssistantChatDto) {
    const lang = dto.lang === "en" ? "en" : "ar";
    const message = dto.message.trim().slice(0, 400);
    let profile = await this.profiles.get(userId);
    if (isForgetRequest(message)) {
      await this.profiles.forget(userId);
      await this.writeSession(userId, emptyState());
      const reply = lang === "ar" ? "تمام، مسحت كل اللي أتذكره عنج. نبدي من جديد." : "Done, I cleared everything I remembered about you.";
      return this.answer(lang, reply, [], []);
    }
    if (isMemoryQuestion(message)) return this.answer(lang, describeProfile(lang, profile), [], []);

    let learned = "";
    const facts = extractProfileFacts(message);
    if (hasFacts(facts)) {
      const saved = await this.profiles.learn(userId, profile, facts);
      profile = saved.profile;
      if (saved.changed) learned = learnedReply(lang, facts, saved.liked, saved.avoided);
    }
    const result = await this.respondTurn(userId, dto, lang, message, profile);
    return learned ? { ...result, reply: `${learned} ${result.reply}`.trim() } : result;
  }

  private async respondTurn(userId: string, dto: AssistantChatDto, lang: "ar" | "en", message: string, profile: CustomerProfile) {
    let previous = await this.readSession(userId);
    if (!dto.history?.length) {
      previous = { ...emptyState(), gender: previous.gender, excludedBrands: [...previous.excludedBrands] };
      await this.writeSession(userId, previous);
    }
    previous = { ...previous, about: profileSummary(profile) || undefined };
    if (isNameQuestion(message)) return this.answer(lang, nameReply(lang), [], []);
    const asked = clarify(message, previous);
    const question = asked && !profileAnswersClarify(asked.kind, profile) ? asked : null;
    if (question) {
      await this.writeSession(userId, {
        ...previous,
        kind: question.kind ?? previous.kind,
        concern: undefined,
        also: [],
        shown: [],
        seenIds: [],
        goal: message.slice(0, 180),
        priceTier: priceTierOf(message) ?? previous.priceTier,
      });
      return this.answer(lang, question.reply, [], question.suggestions, "clarify");
    }
    const focus = askedStep(message);
    if (focus && previous.shown.length > 0) {
      const reply = stepAnswer(lang, previous, previous.shown, focus);
      if (reply) return this.answer(lang, reply, this.cards(previous, previous.shown, lang), this.followups(lang, previous));
    }
    if (isRoutineUsage(message) && previous.shown.length > 1) {
      return this.answer(lang, usageReply(lang, previous.shown), this.cards(previous, previous.shown, lang), []);
    }
    if (this.gpt.enabled) {
      try {
        return await this.answerFromMeaning(userId, lang, message, previous, dto.history ?? [], dto.voice === true);
      } catch (error) {
        this.logger.warn(`assistant model failed: ${error instanceof Error ? error.message : error}`);
      }
    }
    const turn = understand(message, previous);
    const plan = planAgent(turn);

    if (plan.action === "talk") {
      const grounded = lang === "ar"
        ? "جاوبي كصديقة باختصار، بدون ما تعرضين منتجات، إلا إذا هي طلبت شراء."
        : "Answer like a friend, briefly, and do not recommend products unless she asked to buy.";
      const reply = await this.phrase(lang, message, this.memoryLine(previous), grounded, [], "chat", dto.history ?? []);
      return this.answer(lang, reply, [], []);
    }

    if (turn.kind === "reference" && turn.referenceIndex != null) {
      const item = previous.shown[turn.referenceIndex];
      await this.writeSession(userId, turn.state);
      return this.answer(lang, this.referenceReply(lang, turn.referenceIndex, item), item ? [item.card] : [], []);
    }

    if (turn.kind === "compare" && turn.compareIndexes) {
      const [left, right] = turn.compareIndexes.map((index) => previous.shown[index]);
      return this.answer(
        lang,
        this.compareReply(lang, left, right),
        [left, right].filter(Boolean).map((item) => item!.card),
        [],
      );
    }

    if (turn.kind === "explain") {
      const item = turn.referenceIndex == null ? undefined : previous.shown[turn.referenceIndex];
      await this.writeSession(userId, turn.state);
      const grounded = this.explainReply(lang, message, item);
      const reply = await this.phrase(lang, message, "شرح المنتج الحالي فقط", grounded, item ? [item as CatalogRow] : [], "explain", dto.history ?? []);
      return this.answer(lang, reply, [], []);
    }

    const rows = await this.retrieve(turn.state, plan.queries);
    await this.writeSession(userId, { ...turn.state, shown: rows.slice(0, 3), focusIndex: 0 });
    if (rows.length === 0) {
      return this.answer(lang, this.emptyReply(lang, turn.state), [], [], "empty");
    }

    const chosen = rows.slice(0, 3);
    const grounded = this.groundedReply(lang, turn.state, chosen);
    const reply = await this.phrase(lang, message, `${turn.note}. ${this.memoryLine(previous)}`, grounded, chosen, "recommend", dto.history ?? []);
    return this.answer(lang, reply, plan.showProducts ? chosen.map((item) => item.card) : [], this.followups(lang, turn.state));
  }

  private async answerFromMeaning(
    userId: string,
    lang: "ar" | "en",
    message: string,
    previous: ShoppingState,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    voice: boolean,
  ) {
    const brief = await this.gpt.interpret({ lang, message, history, memory: this.memoryLine(previous) });
    const turn = turnFromBrief(previous, message, brief);
    if (turn.kind === "smalltalk" || turn.kind === "advice") {
      const reply = brief.reply || (lang === "ar" ? "حاضرة، احكيلي شنو تدورين عليه." : "I'm here. Tell me what you want.");
      return this.answer(lang, reply, [], []);
    }
    if (turn.kind === "compare" && turn.compareIndexes) {
      const items = turn.compareIndexes.map((index) => previous.shown[index]).filter(Boolean);
      const grounded = [this.compareReply(lang, items[0], items[1]), ...items.map((item) => item?.description).filter(Boolean)].join("\n");
      const reply = await this.phrase(lang, message, "قارني المنتجين الظاهرين فقط ومن بياناتهما", grounded, [], "explain", history);
      return this.answer(lang, reply, items.map((item) => item!.card), []);
    }
    if (turn.kind === "explain" && turn.referenceIndex != null) {
      const item = previous.shown[turn.referenceIndex];
      await this.writeSession(userId, turn.state);
      if (!item) return this.answer(lang, this.referenceReply(lang, turn.referenceIndex, item), [], []);
      const grounded = `${this.referenceReply(lang, turn.referenceIndex, item)} ${item.description ?? ""} ${item.howToUse ?? ""}`.trim();
      const reply = await this.phrase(lang, message, "عن هذا المنتج فقط ومن بياناته المكتوبة", grounded, [item as CatalogRow], "explain", history);
      return this.answer(lang, reply, [item.card], []);
    }
    return this.shop(userId, lang, message, turn, history, voice, brief.queries);
  }

  private async answerWithModel(
    userId: string,
    lang: "ar" | "en",
    message: string,
    turn: Turn,
    previous: ShoppingState,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    voice: boolean,
  ) {
    let active = turn;
    let prepared: string[] | undefined;
    if (!turn.moreCount && turn.kind !== "compare") {
      try {
        const brief = await this.gpt.interpret({ lang, message, history, memory: this.memoryLine(turn.state) });
        active = applyBrief(turn, brief);
        prepared = brief.queries;
        if (brief.move === "chat" && active.kind === "smalltalk" && brief.reply) {
          return this.answer(lang, brief.reply, [], []);
        }
      } catch (error) {
        this.logger.warn(`interpret skipped: ${error instanceof Error ? error.message : error}`);
      }
    }
    if (active.kind === "smalltalk" || active.kind === "advice") {
      const grounded = lang === "ar"
        ? "جاوبي كصديقة باختصار، بدون منتجات وبدون سعر مخترع. إذا تريد شراء خليها تطلب المنتج."
        : "Answer like a friend, with no products and no invented prices.";
      const reply = await this.phrase(lang, message, this.memoryLine(previous), grounded, [], "chat", history);
      return this.answer(lang, reply, [], []);
    }

    if (active.kind === "reference" && active.referenceIndex != null) {
      const item = previous.shown[active.referenceIndex];
      await this.writeSession(userId, active.state);
      if (!item) return this.answer(lang, this.referenceReply(lang, active.referenceIndex, item), [], []);
      const grounded = `${this.referenceReply(lang, active.referenceIndex, item)} ${item.description ?? ""} ${item.howToUse ?? ""}`.trim();
      const reply = await this.phrase(lang, message, "عن هذا المنتج فقط", grounded, [item as CatalogRow], "explain", history);
      return this.answer(lang, reply, [item.card], []);
    }

    if (active.kind === "compare" && active.compareIndexes) {
      const items = active.compareIndexes.map((index) => previous.shown[index]).filter(Boolean);
      const grounded = [
        this.compareReply(lang, items[0], items[1]),
        ...items.map((item) => item?.description).filter(Boolean),
      ].join("\n");
      const reply = await this.phrase(lang, message, "مقارنة المنتجَين المعروضَين فقط", grounded, [], "explain", history);
      return this.answer(lang, reply, items.map((item) => item!.card), []);
    }

    if (active.kind === "explain") {
      const item = active.referenceIndex == null ? undefined : previous.shown[active.referenceIndex];
      await this.writeSession(userId, active.state);
      const grounded = this.explainReply(lang, message, item);
      const reply = await this.phrase(lang, message, "شرح المنتج الحالي فقط", grounded, item ? [item as CatalogRow] : [], "explain", history);
      return this.answer(lang, reply, [], []);
    }

    return this.shop(userId, lang, message, active, history, voice, prepared);
  }

  private async shop(
    userId: string,
    lang: "ar" | "en",
    message: string,
    turn: Turn,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    voice: boolean,
    prepared?: string[],
  ) {
    let state: ShoppingState = {
      ...turn.state,
      traits: [...(turn.state.traits ?? [])],
      excludedBrands: [...turn.state.excludedBrands],
      shown: turn.state.shown,
      seenIds: [...(turn.state.seenIds ?? [])],
    };
    const moreCount = turn.moreCount ?? 0;
    let modelQueries = prepared ?? [];
    if (!moreCount && !prepared) {
      try {
        const brief = await this.gpt.interpret({ lang, message, history, memory: this.memoryLine(state) });
        if (!brief.shop && state.kind === "other" && !state.concern && state.maxPrice == null) {
          const reply = brief.reply || (lang === "ar" ? "حاضرة، احكيلي شنو تدورين عليه." : "I'm here. Tell me what you want.");
          return this.answer(lang, reply, [], []);
        }
        state = this.mergeBrief(state, brief, message);
        modelQueries = brief.queries;
      } catch (error) {
        this.logger.warn(`interpret skipped: ${error instanceof Error ? error.message : error}`);
      }
    }
    if (!moreCount && turn.kind === "recommend" && message.trim().split(/\s+/).length >= 2 && !stepToReplace(message)) {
      state = { ...state, goal: message.trim().slice(0, 180) };
    }
    const profile = await this.profiles.get(userId);
    state = applyProfile(state, profile, message, canonicalBrand);
    const slot = !moreCount ? stepToReplace(message) : null;
    if (slot && state.shown.length > 0) {
      const replaced = await this.replaceRoutineStep(userId, lang, state, slot);
      if (replaced) return replaced;
    }
    const queries = this.usableQueries([
      ...searchQueries(state, turn.searchTerm),
      ...modelQueries,
      turn.searchTerm,
      message,
      ...(moreCount ? broadenQueries(state) : []),
    ]);
    const [lexical, meaning] = await Promise.all([
      this.gather(queries, moreCount ? 80 : 40),
      this.semanticRows(this.meaningQuery(state, message), moreCount ? 60 : 40),
    ]);
    let rows = this.mergeRows(lexical, meaning);
    let scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
    if (!moreCount && (!scored.length || scored[0].score < 4)) {
      try {
        const retry = await this.gpt.retryQueries({ lang, goal: state.goal || message, tried: queries });
        const fresh = retry.filter((query) => !queries.includes(query));
        if (fresh.length) {
          rows = this.mergeRows(rows, await this.gather(fresh, 40));
          scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
        }
      } catch (error) {
        this.logger.warn(`search retry skipped: ${error instanceof Error ? error.message : error}`);
      }
    }
    if (scored.length < Math.max(moreCount, 1)) {
      const extra = broadenQueries(state).filter((query) => !queries.includes(query));
      if (extra.length) {
        rows = this.mergeRows(rows, await this.gather(extra, 80));
        scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
      }
    }
    const guides = moreCount ? [] : await this.guides.active();
    const hidden = hiddenProductIds(state, guides);
    for (const row of rows) {
      if (triggersSensitivity(row, profile, state.kind)) hidden.add(row.id);
    }
    if (hidden.size) {
      rows = rows.filter((row) => !hidden.has(row.id));
      scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
    }
    const promoIds = promotedProductIds(state, guides).filter((id) => !rows.some((row) => row.id === id) && !hidden.has(id));
    if (promoIds.length) {
      const promoted = await this.loadByIds(promoIds);
      rows = this.mergeRows(rows, promoted.filter((row) => !triggersSensitivity(row, profile, state.kind)));
      scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
    }
    const routineOn = !moreCount && wantsRoutine(state, message);
    const plan = routineOn ? routinePlan(state) : null;
    const sortBy = state.priceTier === "premium" ? "price" : state.priceTier === "value" ? "priceAsc" : "popular";
    const extras: Array<Promise<CatalogRow[]>> = [];
    if (!moreCount && state.priceTier) extras.push(this.gather(queries, 40, sortBy));
    if (plan) {
      for (const step of plan) {
        extras.push(this.gather(step.queries, 16, sortBy));
        extras.push(this.semanticRows(step.queries.join(" "), 16));
      }
    }
    if (extras.length) {
      for (const extra of await Promise.all(extras)) {
        rows = this.mergeRows(rows, extra.filter((row) => !hidden.has(row.id) && !triggersSensitivity(row, profile, state.kind)));
      }
      scored = scoredMatches(rows.filter((row) => acceptsProduct(this.candidate(row), state)), state);
    }
    const take = moreCount || 8;
    const pool = scored.map((item) => item.row);
    const typed = pool.filter((row) => kindFits(row, state));
    const pickedFits = routineOn ? consultPicks(pool, state) : (typed.length ? typed : pool).slice(0, take);
    const fits = moreCount ? pickedFits : steerPicks(pickedFits, pool, state, guides);
    const training = guideNotes(state, guides);
    const relaxedPrice = { ...state, maxPrice: undefined, minPrice: undefined };
    const overBudget = state.maxPrice == null
      ? []
      : rankMatches(
          rows.filter((row) => row.price > state.maxPrice! && acceptsProduct(this.candidate(row), relaxedPrice)),
          relaxedPrice,
        ).slice(0, 1);

    if (!fits.length && overBudget.length) {
      const top = overBudget[0];
      await this.remember(userId, state, overBudget);
      const name = lang === "en" ? top.nameEn || top.nameAr : top.nameAr || top.nameEn;
      const reply = lang === "ar"
        ? `ما لقيت ضمن ${state.maxPrice!.toLocaleString("en-US")} دينار. أقرب خيار حقيقي هو ${name} من ${top.brand} بسعر ${top.price.toLocaleString("en-US")} دينار، وهو فوق ميزانيتج.`
        : `Nothing is within ${state.maxPrice} IQD. The closest real option is ${name} by ${top.brand} at ${top.price} IQD, over your budget.`;
      return this.answer(lang, reply, [top.card], this.followups(lang, state));
    }

    if (!fits.length) {
      await this.writeSession(userId, { ...state, shown: moreCount ? state.shown : [], focusIndex: 0 });
      const empty = moreCount
        ? (lang === "ar" ? "هاي كل الخيارات المناسبة لطلبج. ماكو نتائج زيادة بالمتجر." : "Those are all the matches. There are no further results.")
        : this.emptyReply(lang, state);
      return this.answer(lang, empty, [], [], "empty");
    }

    if (moreCount) {
      const reply = lang === "ar"
        ? `لقيت لج ${fits.length} خيارات زيادة، غير اللي عرضتهم. شوفي البطاقات.`
        : `Here are ${fits.length} more options, different from the ones already shown.`;
      await this.remember(userId, state, fits);
      return this.answer(lang, reply, fits.map((row) => row.card), []);
    }

    const choice = await this.gpt.choose({
      lang,
      message: `${message}\nقيود الطلب: ${this.memoryLine(state) || turn.note}\n${adviceBrief(state, fits)}${training ? `\nتدريب اللوحة: ${training}` : ""}`,
      history,
      catalog: this.catalogText(fits),
      voice,
    });
    const picked = fits.filter((row) => choice.productIds.includes(row.id));
    const shown = routineOn ? fits : picked.length ? picked.slice(0, 3) : scored.slice(0, 2).map((item) => item.row);
    if (!shown.length) {
      await this.writeSession(userId, { ...state, shown: [], focusIndex: 0 });
      const honest = choice.reply && !this.inventedPrice(choice.reply, fits) ? choice.reply : this.emptyReply(lang, state);
      return this.answer(lang, honest, [], choice.suggestions, "empty");
    }
    let reply = picked.length || routineOn ? choice.reply : "";
    const consulted = consultantReply(lang, state, shown);
    if (!reply || !this.coversProducts(reply, shown) || this.inventedPrice(reply, shown) || (state.kind === "perfume" && /سبلاش|splash/i.test(reply))) {
      const grounded = consulted || this.groundedReply(lang, state, shown);
      reply = await this.phrase(lang, message, `${turn.note}. ${adviceBrief(state, shown)}`, grounded, shown, "recommend", history);
      if (!this.coversProducts(reply, shown) || this.inventedPrice(reply, shown)) reply = grounded;
    }
    if (state.fromProfile && state.profileNote && lang === "ar" && !reply.includes(state.profileNote)) {
      reply = `حسب اللي أعرفه، ${state.profileNote}. ${reply}`;
    }
    await this.remember(userId, state, shown);
    return this.answer(lang, reply, this.cards(state, shown, lang), choice.suggestions.length ? choice.suggestions : this.followups(lang, state));
  }

  private async remember(userId: string, state: ShoppingState, shown: CatalogRow[]) {
    const seenIds = [...new Set([...(state.seenIds ?? []), ...shown.map((row) => row.id)])];
    await this.writeSession(userId, { ...state, shown, seenIds, focusIndex: 0 });
  }

  private mergeRows(current: CatalogRow[], extra: CatalogRow[]) {
    const seen = new Set(current.map((row) => row.id));
    return [...current, ...extra.filter((row) => !seen.has(row.id))];
  }

  /** بحث سريع للصوت المباشر: يرجع حقائق المتجر فقط، والكلام يصير فوراً على القناة الحية. */
  async voiceLookup(userId: string, utterance: string) {
    const text = utterance.trim().slice(0, 400);
    const previous = await this.readSession(userId);
    const turn = understand(text, previous);
    if (!text || turn.kind === "smalltalk" || turn.kind === "advice") {
      return { found: false, sayExactly: "", products: [] as unknown[], note: "حديث بدون شراء. جاوبي بجملة عراقية قصيرة وبدون منتجات." };
    }
    if ((turn.kind === "explain" || turn.kind === "reference") && turn.referenceIndex != null) {
      const item = previous.shown[turn.referenceIndex];
      await this.writeSession(userId, turn.state);
      if (!item) return { found: false, sayExactly: "ما عندي هذا المنتج بالمحادثة.", products: [] as unknown[], note: "" };
      return {
        found: true,
        sayExactly: this.explainReply("ar", text, item),
        products: [item.card],
        note: "اقرئي النص كما هو.",
      };
    }
    if (turn.kind === "compare" && turn.compareIndexes) {
      const items = turn.compareIndexes.map((index) => previous.shown[index]).filter(Boolean);
      return {
        found: items.length === 2,
        sayExactly: this.compareReply("ar", items[0], items[1]),
        products: items.map((item) => item!.card),
        note: "اقرئي المقارنة كما هي.",
      };
    }

    const result = await this.shop(userId, "ar", text, turn, [], true);
    return {
      found: result.products.length > 0,
      sayExactly: result.reply,
      products: result.products,
      note: "اقرئي sayExactly كما هو. لا تضيفين منتجاً أو سعراً من عندج.",
    };
  }

  private mergeBrief(state: ShoppingState, brief: AssistantBrief, message: string): ShoppingState {
    const next: ShoppingState = { ...state, traits: [...(state.traits ?? [])], excludedBrands: [...state.excludedBrands] };
    const switched = productSwitch(message, next.kind);
    if (switched) {
      next.kind = switched.kind;
      next.concern = undefined;
      next.traits = [];
      next.seenIds = [];
      next.shown = [];
      next.goal = undefined;
      if (priceBounds(message).maxPrice == null) {
        next.maxPrice = undefined;
        next.minPrice = undefined;
      }
    } else if (next.kind === "other" && brief.kind && KINDS.has(brief.kind as ProductKind)) {
      next.kind = brief.kind as ProductKind;
    }
    if (!next.concern && brief.concern && CONCERNS.has(brief.concern as Concern)) next.concern = brief.concern as Concern;
    if (priceBounds(message).maxPrice == null && brief.maxPrice && /\d|الف|ألف/.test(message)) next.maxPrice = brief.maxPrice;
    return next;
  }

  private usableQueries(queries: string[]) {
    const skip = /^(اريد|ابي|شي|من|في|على|حق|مال|هذا|هذي|بس|لو|عندج|عدكم|منتج|لا|حولي|حول|حوله|بدله|بداله|مو|عن|شنو|احجيلي|احجي)$/;
    const out: string[] = [];
    for (const query of queries) {
      const tokens = query.split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 2 && !skip.test(token.toLowerCase()));
      if (!tokens.length) continue;
      out.push(tokens.slice(0, 3).join(" "));
      if (tokens.length > 3) out.push(tokens.slice(-2).join(" "));
    }
    return [...new Set(out)].slice(0, 6);
  }

  private candidate(row: CatalogRow) {
    return { ...row, description: [row.description, row.howToUse, row.ingredients].filter(Boolean).join(" ") };
  }

  private coversProducts(reply: string, rows: CatalogRow[]) {
    return rows.every((row) => {
      const name = (row.nameAr || row.nameEn).replace(/\s+/g, " ").trim();
      if (name.length >= 4 && reply.includes(name.slice(0, Math.min(8, name.length)))) return true;
      return name.split(/\s+/).some((word) => word.length >= 4 && reply.includes(word));
    });
  }

  /** بطاقات الروتين تنرقّم بخطوتها حتى التطبيق يعرضها كخطة، مو قائمة. */
  private cards(state: ShoppingState, rows: ShownProduct[], lang: "ar" | "en") {
    if (!routinePlan(state) || rows.length < 2) return rows.map((row) => row.card);
    return rows.map((row, index) => {
      const label = stepLabel(productRole(row), lang);
      return label ? { ...row.card, assistantStep: { index: index + 1, label } } : row.card;
    });
  }

  /** نكتب الطلب بنفس شكل نص المنتجات المخزّن، مو باللهجة الخام، حتى المقارنة بالمعنى تكون دقيقة. */
  private meaningQuery(state: ShoppingState, message: string) {
    const concerns = [state.concern, ...(state.also ?? [])].filter((item): item is Concern => Boolean(item));
    return [
      state.kind !== "other" ? `kind: ${KIND_WORDS[state.kind] ?? state.kind}` : "",
      concerns.length ? `for: ${concerns.map((item) => CONCERN_WORDS[item] ?? item).join(", ")}` : "",
      `request: ${state.goal || message}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private async semanticRows(text: string, limit: number) {
    const ids = await this.catalog.semantic(text, limit);
    return ids.length ? this.loadByIds(ids) : [];
  }

  private async loadByIds(ids: string[]) {
    if (!ids.length) return [];
    const items = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
        _count: { select: { shades: true } },
      },
    });
    return this.catalog.attach(items.map((item) => this.toRow(withPlaceholderImages(rewriteProductMediaUrls(item)))));
  }

  private async gather(queries: string[], limit = 40, sortBy: "popular" | "price" | "priceAsc" = "popular") {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const query of queries) {
      const found = await findAssistantProductIds(this.prisma, query, sortBy);
      for (const id of found) {
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
      if (ids.length >= limit) break;
    }
    if (!ids.length) {
      const loaded = await Promise.all(queries.map((query) => this.load(query)));
      return this.catalog.attach(loaded.flat());
    }
    const items = await this.prisma.product.findMany({
      where: { id: { in: ids.slice(0, limit) }, isActive: true },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
        _count: { select: { shades: true } },
      },
    });
    const order = new Map(ids.map((id, index) => [id, index]));
    const rows = items
      .map((item) => this.toRow(withPlaceholderImages(rewriteProductMediaUrls(item))))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    return this.catalog.attach(rows);
  }

  private catalogText(rows: CatalogRow[]) {
    return rows
      .slice(0, 8)
      .map((row) => {
        const card = row.card as { rating?: number; isBestSeller?: boolean };
        const rating = card.rating ? `تقييم ${Number(card.rating).toFixed(1)}` : "";
        return [
          row.id,
          row.nameAr || row.nameEn,
          row.brand,
          row.category,
          `${row.price} دينار`,
          rating,
          card.isBestSeller ? "الأكثر طلباً" : "",
          row.tags?.summary ? `فائدة: ${row.tags.summary}` : "",
          row.description ? row.description.slice(0, 220) : "",
          row.howToUse ? `استخدام: ${row.howToUse.slice(0, 120)}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      })
      .join("\n");
  }

  private async retrieve(state: ShoppingState, terms: string[]) {
    if (!terms.length) return [];
    const matched = await this.collect(state, terms);
    if (matched.length > 0 || !state.traits?.length) return matched.slice(0, 6);
    const base = terms.map((term) => term.split(" ")[0]).find((term) => term && term.length >= 3);
    if (!base || terms.includes(base)) return [];
    return (await this.collect(state, [base])).slice(0, 6);
  }

  private async collect(state: ShoppingState, terms: string[]) {
    const loaded = await Promise.all(terms.map((item) => this.load(item, state.maxPrice, state.minPrice)));
    const seen = new Set<string>();
    const matched = loaded.flat().filter((row) => {
      const description = [row.description, row.howToUse, row.ingredients].filter(Boolean).join(" ");
      if (seen.has(row.id) || !acceptsProduct({ ...row, description }, state)) return false;
      seen.add(row.id);
      return true;
    });
    return rankMatches(matched, state);
  }

  private memoryLine(state: ShoppingState) {
    const names = state.shown.map((item) => item.nameAr || item.nameEn).filter(Boolean).slice(0, 3);
    const bits = [
      state.goal ? `طلبها: ${state.goal.slice(0, 120)}` : "",
      state.about ? `عنها: ${state.about}` : "",
      state.kind !== "other" ? state.kind : "",
      state.concern ?? "",
      state.also?.length ? `أيضاً ${state.also.join(" ")}` : "",
      state.priceTier === "premium" ? "تريد الغالي" : state.priceTier === "value" ? "تريد الرخيص" : "",
      state.maxPrice ? `سقف ${state.maxPrice}` : "",
      names.length ? `الظاهرة: ${names.map((name, index) => `${index}. ${name}`).join(" | ")}` : "",
    ].filter(Boolean);
    return bits.join(" | ");
  }

  private async readSession(userId: string) {
    const local = this.sessions.get(userId);
    if (local) return local;
    const saved = await this.redis.get<ShoppingState>(`assistant:session:${userId}`);
    const state = saved?.shown ? saved : emptyState();
    this.sessions.set(userId, state);
    return state;
  }

  private async writeSession(userId: string, state: ShoppingState) {
    this.sessions.set(userId, state);
    await this.redis.set(`assistant:session:${userId}`, state, 60 * 60 * 6);
  }

  private explainReply(lang: "ar" | "en", message: string, item?: ShownProduct) {
    if (!item) {
      return lang === "ar"
        ? "قوليلي أي منتج تقصدين، أو اختاري واحد من اللي عرضتهم، وأشرحلك استخدامه ومكوناته من بيانات المتجر."
        : "Tell me which product you mean and I will explain it from the store data.";
    }
    const name = lang === "en" ? item.nameEn || item.nameAr : item.nameAr || item.nameEn;
    const text = message.toLowerCase();
    if (/مكون/.test(text)) {
      return item.ingredients?.trim()
        ? `${name}: ${item.ingredients.trim()}`
        : lang === "ar"
          ? `مكونات ${name} غير مذكورة على المنتج، فما أقدر أخترعها.`
          : `Ingredients for ${name} are not listed, so I won't guess them.`;
    }
    if (/استخدم|استخدام/.test(text)) {
      return item.howToUse?.trim()
        ? `${name}: ${item.howToUse.trim()}`
        : lang === "ar"
          ? `طريقة استخدام ${name} غير مذكورة على المنتج.`
          : `How to use ${name} is not listed on the product.`;
    }
    return item.description?.trim()
      ? `${name}: ${item.description.trim()}`
      : lang === "ar"
        ? `تفاصيل ${name} غير مكتوبة على المنتج. السعر ${item.price.toLocaleString("en-US")} دينار من ${item.brand}.`
        : `Details for ${name} are not written on the product. It costs ${item.price.toLocaleString("en-US")} IQD from ${item.brand}.`;
  }

  private async phrase(
    lang: "ar" | "en",
    message: string,
    note: string,
    grounded: string,
    rows: CatalogRow[],
    mode: "recommend" | "explain" | "chat",
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ) {
    if (!this.gpt.enabled) return grounded;
    const productsText = rows
      .map((row, index) => `${index + 1}. ${row.nameAr || row.nameEn} | ${row.brand} | ${row.price} دينار`)
      .join("\n");
    try {
      const gpt = await this.gpt.chat({
        lang,
        message,
        history,
        productsText: mode === "explain" ? "" : productsText,
        context: `${note}. الحقائق الوحيدة المسموحة: ${grounded}`,
        mode,
      });
      const reply = gpt.reply.trim();
      if (!reply || (/سبلاش|splash/i.test(reply) && !/سبلاش|splash/i.test(note))) return mode === "chat" ? this.chatFallback(lang) : grounded;
      if (mode !== "chat" && this.inventedPrice(reply, rows)) return grounded;
      return reply;
    } catch {
      return mode === "chat" ? this.chatFallback(lang) : grounded;
    }
  }

  private chatFallback(lang: "ar" | "en") {
    return lang === "ar" ? "حاضرة. احكيلي شنو ببالج، شراء أو سؤال عن منتج." : "I'm here. Tell me if you want to shop or ask about a product.";
  }

  private inventedPrice(reply: string, rows: CatalogRow[]) {
    const numbers = [...reply.matchAll(/\d{4,}/g)].map((match) => Number(match[0]));
    const allowed = new Set(rows.map((row) => row.price));
    return numbers.some((value) => ![...allowed].some((price) => Math.abs(price - value) < 2));
  }

  private groundedReply(lang: "ar" | "en", state: ShoppingState, rows: CatalogRow[]) {
    const top = rows[0];
    const price = top.price.toLocaleString("en-US");
    const name = lang === "en" ? top.nameEn || top.nameAr : top.nameAr || top.nameEn;
    const budget = state.maxPrice ? (lang === "ar" ? ` ضمن سقف ${state.maxPrice.toLocaleString("en-US")} دينار` : ` within ${state.maxPrice.toLocaleString("en-US")} IQD`) : "";
    return lang === "ar"
      ? `لقيت ${rows.length} خيارات تناسب طلبج${budget}. أقربها ${name} من ${top.brand} بسعر ${price} دينار.`
      : `I found ${rows.length} matches${budget}. The closest is ${name} by ${top.brand} at ${price} IQD.`;
  }

  private referenceReply(lang: "ar" | "en", index: number, item?: ShownProduct) {
    if (!item) return lang === "ar" ? "ما عندي خيار بهذا الرقم بالمحادثة الحالية." : "That number is not in the current list.";
    const name = lang === "en" ? item.nameEn || item.nameAr : item.nameAr || item.nameEn;
    const label = ["الأول", "الثاني", "الثالث", "الرابع"][index] ?? "هذا";
    return lang === "ar"
      ? `${label} هو ${name} من ${item.brand}، وسعره ${item.price.toLocaleString("en-US")} دينار.`
      : `That one is ${name} by ${item.brand}, priced at ${item.price.toLocaleString("en-US")} IQD.`;
  }

  private compareReply(lang: "ar" | "en", left?: ShownProduct, right?: ShownProduct) {
    if (!left || !right) return lang === "ar" ? "ما أكدر أقارن قبل ما أعرض الخيارات." : "I need both products in the current list before comparing.";
    const gap = Math.abs(left.price - right.price).toLocaleString("en-US");
    return lang === "ar"
      ? `${left.nameAr || left.nameEn} سعره ${left.price.toLocaleString("en-US")} دينار، و${right.nameAr || right.nameEn} سعره ${right.price.toLocaleString("en-US")} دينار. الفرق ${gap} دينار.`
      : `${left.nameEn || left.nameAr} is ${left.price.toLocaleString("en-US")} IQD and ${right.nameEn || right.nameAr} is ${right.price.toLocaleString("en-US")} IQD. The difference is ${gap} IQD.`;
  }

  private emptyReply(lang: "ar" | "en", state: ShoppingState) {
    if (lang === "en") return "Nothing in the store matches every condition. I will not substitute a different product type.";
    const budget = state.maxPrice ? ` بسعر ${state.maxPrice.toLocaleString("en-US")} دينار أو أقل` : "";
    const asked = (state.traits ?? []).slice(0, 3).join(" ");
    const concern = asked ? ` «${asked}»` : "";
    return `ما لقيت ${this.kindLabel(state.kind)} يطابق${concern}${budget}. ما أعرض منتج قريب بالاسم بس مختلف بالطلب.`;
  }

  private kindLabel(kind: ShoppingState["kind"]) {
    switch (kind) {
      case "perfume":
        return "عطر";
      case "splash":
        return "سبلاش";
      case "shampoo":
        return "شامبو";
      case "mask":
        return "ماسك";
      case "serum":
        return "سيروم";
      case "moisturizer":
        return "مرطب";
      case "cream":
        return "كريم";
      case "cleanser":
        return "غسول";
      case "sunscreen":
        return "واقي";
      case "lipstick":
        return "روج";
      default:
        return "منتج";
    }
  }

  private followups(lang: "ar" | "en", state: ShoppingState) {
    if (routinePlan(state)) {
      return lang === "ar" ? ["شلون أستخدمهم ويا بعض", "بدلي الخطوة الثانية", "أرخص"] : ["How to use them together", "Replace step two", "Cheaper"];
    }
    if (!state.maxPrice && state.kind === "other") return [];
    return lang === "ar" ? ["شلون أستخدمه", "المزيد", "أرخص"] : ["How to use it", "More", "Cheaper"];
  }

  private async replaceRoutineStep(userId: string, lang: "ar" | "en", state: ShoppingState, slot: "wash" | "treat" | "care" | "protect") {
    const step = routinePlan(state)?.find((item) => item.role === slot);
    if (!step) return null;
    const sortBy = state.priceTier === "premium" ? "price" : state.priceTier === "value" ? "priceAsc" : "popular";
    const [lexical, meaning] = await Promise.all([this.gather(step.queries, 20, sortBy), this.semanticRows(step.queries.join(" "), 20)]);
    const found = this.mergeRows(lexical, meaning);
    const seen = { ...state, seenIds: [...new Set([...(state.seenIds ?? []), ...state.shown.map((item) => item.id)])] };
    const ranked = scoredMatches(found.filter((row) => acceptsProduct(this.candidate(row), seen)), seen);
    const anchor = state.shown.find((item) => productRole(item) !== slot)?.brand;
    const next = preferCompanyPick(ranked, slot, anchor);
    if (!next) {
      const reply = lang === "ar" ? "ما لقيت بديل مناسب لهالخطوة بالمتجر." : "I could not find another match for that step.";
      return this.answer(lang, reply, this.cards(state, state.shown, lang), this.followups(lang, state));
    }
    const shown = replaceStep(state.shown, slot, next);
    const reply = consultantReply(lang, state, shown) || (lang === "ar"
      ? `بدلت هالخطوة إلى ${next.nameAr || next.nameEn} بسعر ${next.price.toLocaleString("en-US")} دينار.`
      : `I replaced that step with ${next.nameEn || next.nameAr} at ${next.price.toLocaleString("en-US")} IQD.`);
    await this.remember(userId, state, shown as CatalogRow[]);
    return this.answer(lang, reply, this.cards(state, shown, lang), this.followups(lang, state));
  }

  private answer(lang: "ar" | "en", reply: string, products: unknown[], suggestions: string[], outcome?: TurnOutcome) {
    void lang;
    return { reply, products, suggestions, outcome };
  }

  private async load(term: string, maxPrice?: number, minPrice?: number): Promise<CatalogRow[]> {
    const key = `${term}|${minPrice ?? ""}|${maxPrice ?? ""}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < 60_000) return cached.rows;
    const page = await this.products.list(
      Object.assign(new QueryProductsDto(), { search: term, page: 1, limit: 24, lite: true, minPrice, maxPrice }),
      true,
    );
    const rows = (page.data as any[]).map((item) => this.toRow(item));
    this.cache.set(key, { at: Date.now(), rows });
    return rows;
  }

  private toRow(item: any): CatalogRow {
    const image = Array.isArray(item.images) ? item.images[0] : null;
    const card = {
      id: item.id,
      sku: item.sku ?? "",
      name: item.name ?? "",
      nameAr: item.nameAr ?? null,
      nameEn: item.nameEn ?? null,
      slug: item.slug ?? "",
      price: item.price ?? 0,
      originalPrice: item.originalPrice ?? item.price ?? 0,
      discountPercent: item.discountPercent ?? 0,
      rating: item.rating ?? 0,
      stock: item.stock ?? 0,
      isPromo: Boolean(item.isPromo),
      isNew: Boolean(item.isNew),
      isBestSeller: Boolean(item.isBestSeller),
      brand: item.brand ? { id: item.brand.id, name: item.brand.name, slug: item.brand.slug } : null,
      images: image ? [image] : [],
      _count: { shades: Number(item._count?.shades ?? 0) },
    };
    return {
      id: String(item.id),
      nameAr: String(item.nameAr ?? item.name ?? ""),
      nameEn: String(item.nameEn ?? item.name ?? ""),
      brand: String(item.brand?.name ?? ""),
      category: String(item.category?.name ?? ""),
      price: Number(item.price ?? 0),
      description: String(item.descriptionAr || item.description || "").replace(/\s+/g, " ").trim(),
      howToUse: String(item.howToUse || "").replace(/\s+/g, " ").trim(),
      ingredients: String(item.ingredients || "").replace(/\s+/g, " ").trim(),
      blurb: "",
      card,
    };
  }
}
