import { canonicalBrand, detectConcern, detectConcerns, detectKind, distinctTraits, priceBounds, priceTierOf, traitAliases, understand } from "./understand";
import { Concern, emptyState, ProductKind, ProductTagLite, ShoppingState, Turn } from "./types";

export type AgentAction = "talk" | "explain" | "shop" | "lookup" | "compare";

export type AgentPlan = {
  action: AgentAction;
  queries: string[];
  showProducts: boolean;
};

/** يقرر خطوات الوكيل: يحكي، يشرح، أو يبحث. ما يبحث إذا السؤال مو طلب شراء. */
export function planAgent(turn: Turn): AgentPlan {
  if (turn.kind === "smalltalk" || turn.kind === "advice") {
    return { action: "talk", queries: [], showProducts: false };
  }
  if (turn.kind === "explain") {
    return { action: "explain", queries: [], showProducts: false };
  }
  if (turn.kind === "reference") {
    return { action: "lookup", queries: [], showProducts: false };
  }
  if (turn.kind === "compare") {
    return { action: "compare", queries: [], showProducts: true };
  }
  return { action: "shop", queries: searchQueries(turn.state, turn.searchTerm), showProducts: true };
}

const CONCERN_RE: Record<string, RegExp> = {
  hairloss: /تساقط|تساقذ|يتساقط|يطيح|يطوح|كثافه|كثافة|تقوية|تقويه|hair loss|anti-hair|hairfall/i,
  dandruff: /قشرة|dandruff/i,
  colored: /مصبوغ|صبغ|color/i,
  dry: /جاف|جفاف|dry/i,
  oily: /دهني|دهون|oily/i,
  acne: /حبوب|حب الشباب|حب شباب|بثور|acne/i,
  pigment: /تفتيح|تصبغ|بقع|pigment|brighten|whitening/i,
  sensitive: /حساس|حساسة|sensitive/i,
};

type MatchRow = {
  id: string;
  nameAr: string;
  nameEn: string;
  brand?: string;
  description?: string;
  howToUse?: string;
  ingredients?: string;
  price: number;
  tags?: ProductTagLite;
};

/** يرتّب المرشحين: تطابق الاسم أقوى من الوصف، والمنتج البعيد عن الفائدة يتشال. */
export function scoredMatches<T extends MatchRow>(rows: T[], state: ShoppingState): Array<{ row: T; score: number }> {
  const concern = state.concern ? CONCERN_RE[state.concern] : null;
  const kind = state.kind === "shampoo" ? /شامبو|shampoo/i : state.kind === "perfume" ? /عطر|parfum|perfume/i : null;
  const ranked = rows
    .map((row) => {
      const name = `${row.nameAr} ${row.nameEn}`;
      const desc = row.description ?? "";
      const tagged = row.tags?.concerns ?? [];
      let score = 0;
      if (kind?.test(name)) score += 2;
      if (concern?.test(name)) score += 6;
      else if (state.concern && tagged.includes(state.concern)) score += 5;
      else if (concern?.test(desc)) score += 3;
      for (const trait of distinctTraits(state)) {
        const aliases = traitAliases(trait);
        if (aliases.some((alias) => name.toLowerCase().includes(alias))) score += 4;
        else if (aliases.some((alias) => desc.toLowerCase().includes(alias))) score += 2;
      }
      for (const extra of state.also ?? []) {
        const pattern = CONCERN_RE[extra];
        if (!pattern) continue;
        if (pattern.test(name)) score += 5;
        else if (tagged.includes(extra)) score += 3;
        else if (pattern.test(desc)) score += 2;
      }
      const babyProduct = /اطفال|أطفال|بيبي|baby|kids/i.test(name) || row.tags?.audience === "baby";
      if (babyProduct && state.audience !== "baby") score -= 10;
      if (score > 0 && row.brand && favoredBrand(row.brand, state)) score += 2;
      return { row, score };
    })
    .filter((item) => item.score >= 0);
  ranked.sort((a, b) => compareMatches(a, b, state));
  const seen = new Set(state.seenIds ?? []);
  return ranked.filter((item) => !seen.has(item.row.id));
}

function favoredBrand(brand: string, state: ShoppingState) {
  if (!state.preferBrands?.length) return false;
  const key = canonicalBrand(brand);
  return state.preferBrands.some((liked) => canonicalBrand(liked) === key);
}

export function rankMatches<T extends MatchRow>(rows: T[], state: ShoppingState): T[] {
  return scoredMatches(rows, state).map((item) => item.row);
}

/** إذا الفرق بالتطابق صغير، غالي يقدّم الأعلى سعراً ورخيص يقدّم الأقل. التطابق البعيد يبقى أولاً. */
function compareMatches(a: { row: MatchRow; score: number }, b: { row: MatchRow; score: number }, state: ShoppingState) {
  const gap = b.score - a.score;
  if (state.priceTier === "premium" || state.priceTier === "value") {
    if (Math.abs(gap) >= 5) return gap;
    const byPrice = state.priceTier === "premium" ? b.row.price - a.row.price : a.row.price - b.row.price;
    return byPrice || gap;
  }
  return gap || (state.maxPrice ? b.row.price - a.row.price : 0);
}

/** إذا البحث الضيق ما لقى، نفكك العبارة لمرادفات أقصر بدون ما نرجّع كل الشامبوهات. */
export function broadenQueries(state: ShoppingState): string[] {
  const focused = searchQueries(state, "");
  const pieces = focused.flatMap((query) => query.split(/\s+/).filter((token) => token.length >= 3 && token !== "شامبو"));
  return [...new Set([...focused, ...pieces])].slice(0, 4);
}

/** يوسّع طلب الشراء لمرادفات الفائدة بدون ما يرجع لكل الشامبوهات. */
export function searchQueries(state: ShoppingState, term: string): string[] {
  const queries = [term];
  if (state.kind === "shampoo") queries.push("شامبو", "shampoo");
  if (state.kind === "cream") queries.push("كريم", "cream");
  if (state.kind === "serum") queries.push("سيروم", "serum");
  if (state.kind === "moisturizer") queries.push("مرطب", "moisturizer");
  if (state.kind === "cleanser") queries.push("غسول", "cleanser");
  if (state.kind === "perfume") queries.push("parfum", "عطر");
  if (state.kind === "sunscreen") queries.push("واقي شمس", "sunscreen", "spf", "sunblock", "صن بلوك");
  if (state.concern === "hairloss") queries.push("تساقط الشعر", "hair loss", "anti hair fall");
  if (state.concern === "dandruff") queries.push("قشرة", "anti dandruff");
  if (state.concern === "colored") queries.push("شعر مصبوغ", "color protect");
  if (state.concern === "dry") queries.push("شعر جاف", "dry hair");
  if (state.concern === "oily") queries.push("شعر دهني", "oily hair");
  if (state.concern === "acne") queries.push("حبوب", "acne");
  if (state.concern === "pigment") queries.push("تفتيح", "brightening");
  if (state.concern === "sensitive") queries.push("بشرة حساسة", "sensitive skin");
  for (const trait of distinctTraits(state)) {
    const alias = traitAliases(trait).find((item) => item !== trait);
    if (alias) queries.push(alias);
  }
  return [...new Set(queries.map((item) => item.trim()).filter(Boolean))].slice(0, 5);
}

const BRIEF_KINDS = new Set<ProductKind>(["perfume", "splash", "shampoo", "mask", "serum", "moisturizer", "cream", "cleanser", "sunscreen", "lipstick", "other"]);
const BRIEF_CONCERNS = new Set<Concern>(["hairloss", "dry", "oily", "colored", "dandruff", "acne", "pigment", "sensitive"]);

export type ModelMove = {
  move?: string;
  kind?: string;
  concern?: string;
  maxPrice?: number;
  moreCount?: number;
  focusIndex?: number;
  compareIndexes?: number[];
};

/** يطبّق فهم النموذج على المحادثة: تحويل، شرح منتج ظاهر، أو دفعة نتائج جديدة. */
export function applyBrief(turn: Turn, brief: ModelMove): Turn {
  const move = brief.move;
  if (move === "chat" && !(turn.kind === "recommend" && turn.state.kind !== "other")) {
    return { ...turn, kind: "smalltalk", searchTerm: "", note: "" };
  }
  if (move === "more" && (turn.state.shown.length > 0 || turn.state.kind !== "other" || turn.state.goal)) {
    const count = Math.min(6, Math.max(1, brief.moreCount ?? turn.moreCount ?? 3));
    return {
      ...turn,
      kind: "recommend",
      moreCount: count,
      state: {
        ...turn.state,
        seenIds: [...new Set([...(turn.state.seenIds ?? []), ...turn.state.shown.map((item) => item.id)])],
      },
    };
  }
  if (move === "explain") {
    const index = brief.focusIndex ?? turn.referenceIndex ?? turn.state.focusIndex ?? 0;
    if (turn.state.shown[index]) {
      return { ...turn, kind: "explain", referenceIndex: index, searchTerm: "", state: { ...turn.state, focusIndex: index } };
    }
  }
  if ((move === "switch" || move === "shop") && brief.kind && BRIEF_KINDS.has(brief.kind as ProductKind) && brief.kind !== "other" && brief.kind !== turn.state.kind) {
    return {
      ...turn,
      kind: "recommend",
      moreCount: brief.moreCount,
      searchTerm: "",
      state: {
        ...emptyState(),
        kind: brief.kind as ProductKind,
        concern: brief.concern && BRIEF_CONCERNS.has(brief.concern as Concern) ? (brief.concern as Concern) : undefined,
        audience: "adult",
        maxPrice: brief.maxPrice,
        gender: turn.state.gender,
      },
    };
  }
  return turn;
}

/** الفهم الأساسي من معنى الجملة، مو من كلمات محفوظة. القواعد الرقمية فقط للسعر. */
export function turnFromBrief(previous: ShoppingState, message: string, brief: ModelMove): Turn {
  const parsed = priceBounds(message);
  const maxPrice = parsed.maxPrice ?? brief.maxPrice ?? previous.maxPrice;
  const minPrice = parsed.minPrice ?? previous.minPrice;
  const move = brief.move ?? "shop";
  const nextKind = brief.kind && BRIEF_KINDS.has(brief.kind as ProductKind) ? (brief.kind as ProductKind) : undefined;
  const nextConcern = brief.concern && BRIEF_CONCERNS.has(brief.concern as Concern) ? (brief.concern as Concern) : undefined;

  if (stepToReplace(message) && previous.shown.length > 0) {
    return {
      kind: "recommend",
      searchTerm: "",
      note: "",
      state: {
        ...previous,
        maxPrice: parsed.maxPrice ?? previous.maxPrice,
        minPrice: parsed.minPrice ?? previous.minPrice,
        priceTier: priceTierOf(message) ?? previous.priceTier,
      },
    };
  }

  if (move === "chat") {
    const local = understand(message, previous);
    if (local.kind === "recommend" && (local.state.concern || local.state.kind !== "other")) return local;
    return { kind: "smalltalk", state: previous, searchTerm: "", note: "" };
  }
  if (move === "explain" && !(detectConcern(message) && !/هذا|هذي|الاول|الأول|الثاني|الثالث|الرابع/.test(message))) {
    const index = brief.focusIndex ?? previous.focusIndex ?? (previous.shown.length ? 0 : undefined);
    if (index != null && previous.shown[index]) {
      return {
        kind: "explain",
        state: { ...previous, focusIndex: index },
        referenceIndex: index,
        searchTerm: "",
        note: "",
      };
    }
  }
  if (move === "compare" && brief.compareIndexes && brief.compareIndexes.length >= 2) {
    const [left, right] = brief.compareIndexes;
    if (previous.shown[left] && previous.shown[right]) {
      return { kind: "compare", state: previous, compareIndexes: [left, right], searchTerm: "", note: "" };
    }
  }
  if (move === "cheaper" && previous.shown.length > 0) {
    const floor = Math.min(...previous.shown.map((item) => item.price));
    return {
      kind: "recommend",
      searchTerm: "",
      note: "",
      state: {
        ...previous,
        maxPrice: Math.max(1000, floor - 1),
        minPrice: undefined,
        priceTier: "value",
        seenIds: [...new Set([...(previous.seenIds ?? []), ...previous.shown.map((item) => item.id)])],
      },
    };
  }
  if (move === "more" && (previous.shown.length > 0 || previous.kind !== "other" || previous.goal)) {
    return {
      kind: "recommend",
      moreCount: Math.min(6, Math.max(1, brief.moreCount ?? 3)),
      searchTerm: "",
      note: "",
      state: {
        ...previous,
        maxPrice,
        seenIds: [...new Set([...(previous.seenIds ?? []), ...previous.shown.map((item) => item.id)])],
      },
    };
  }

  const switching = move === "switch" || (nextKind != null && nextKind !== "other" && nextKind !== previous.kind);
  const heard = detectConcerns(message);
  const concernChanged = (nextConcern ?? heard[0]) != null && (nextConcern ?? heard[0]) !== previous.concern;
  const priceTier = tierFrom(message, previous, move);
  if (switching || previous.kind === "other") {
    const concern = nextConcern ?? heard[0];
    return {
      kind: "recommend",
      searchTerm: "",
      note: "",
      state: {
        ...emptyState(),
        kind: nextKind && nextKind !== "other" ? nextKind : "other",
        concern,
        audience: "adult",
        maxPrice,
        minPrice,
        priceTier: priceTierOf(message),
        also: alsoFrom(message, concern, previous, true),
        gender: previous.gender,
        goal: message.trim().slice(0, 180),
      },
    };
  }
  const keptConcern = nextConcern ?? heard[0] ?? previous.concern;
  return {
    kind: "recommend",
    searchTerm: "",
    note: "",
    state: {
      ...previous,
      kind: nextKind && nextKind !== "other" ? nextKind : previous.kind,
      concern: keptConcern,
      also: alsoFrom(message, keptConcern, previous, concernChanged),
      maxPrice,
      minPrice,
      priceTier,
      goal: message.trim().split(/\s+/).length >= 2 ? message.trim().slice(0, 180) : previous.goal,
      seenIds: concernChanged ? [] : previous.seenIds ?? [],
      shown: concernChanged ? [] : previous.shown,
    },
  };
}

function alsoFrom(message: string, primary: ShoppingState["concern"], previous: ShoppingState, reset: boolean) {
  const local = detectConcerns(message).filter((item) => item !== primary);
  if (local.length) return local;
  if (reset) return undefined;
  return previous.also;
}

function tierFrom(message: string, previous: ShoppingState, move: string): ShoppingState["priceTier"] {
  const said = priceTierOf(message);
  if (said) return said;
  if (move === "cheaper") return "value";
  if (move === "more" || move === "explain" || move === "compare") return previous.priceTier;
  if (message.trim().split(/\s+/).length >= 2) return undefined;
  return previous.priceTier;
}

export type RoutineRole = "wash" | "treat" | "care" | "protect";

type RoutineStep = {
  role: RoutineRole;
  optional?: boolean;
  whyAr: string;
  whyEn: string;
  queries: string[];
};

const ROLE_ORDER: RoutineRole[] = ["wash", "treat", "care", "protect"];

function routineStep(role: RoutineRole, optional: boolean, whyAr: string, whyEn: string, queries: string[]): RoutineStep {
  return { role, optional, whyAr, whyEn, queries };
}

/** خطة الاستشارة: كل مشكلة لها خطوات، مو منتج واحد. */
export function routinePlan(state: ShoppingState): RoutineStep[] | null {
  if (state.kind === "perfume" || state.kind === "splash" || state.kind === "lipstick") return null;
  const hair = state.kind === "shampoo" || state.kind === "mask" || state.kind === "serum";
  if (state.concern === "hairloss") {
    const oily = state.also?.includes("oily");
    const colored = state.also?.includes("colored");
    const dry = state.also?.includes("dry");
    const washWhy = oily
      ? "ينظف الفروة الدهنية ويقلل التساقط بدون ما يثقّل الشعر"
      : colored
        ? "يقلل التساقط بدون ما يسحب لون الشعر"
        : "ينظف الفروة ويقلل التساقط وقت الغسل";
    return [
      routineStep("wash", false, washWhy, "cleans the scalp during washing", ["شامبو تساقط", oily ? "شامبو فروة دهنية" : "", colored ? "شامبو شعر مصبوغ" : "", "anti hair loss shampoo"].filter(Boolean)),
      routineStep("treat", false, "يبقى على الفروة بين الغسلات، وهنا فرق العلاج عن الشامبو", "stays on the scalp between washes", ["بخاخ تساقط", "سيروم تساقط", "امبول تساقط", "لوشن فروة", "hair loss spray"]),
      routineStep("care", !dry, dry ? "يرطب الشعر الجاف بعد الغسل حتى التساقط ما يزيد" : "يغذي الشعر بعد الغسل حتى ما يضعف", "nourishes the hair after washing", ["زيت تساقط", "ماسك تساقط", dry ? "ماسك شعر جاف" : "", "hair oil loss"].filter(Boolean)),
    ];
  }
  if (state.concern === "dandruff") {
    return [
      routineStep("wash", false, "يقشر القشرة وقت الغسل", "lifts flakes at wash time", ["شامبو قشرة", "anti dandruff shampoo"]),
      routineStep("treat", false, "يهدي الفروة بين الغسلات", "calms the scalp between washes", ["بخاخ قشرة", "سيروم قشرة", "scalp tonic"]),
    ];
  }
  if (state.concern === "colored" && (hair || state.kind === "other")) {
    return [
      routineStep("wash", false, "ينظف بدون ما يسحب اللون", "cleans without stripping color", ["شامبو شعر مصبوغ", "color shampoo"]),
      routineStep("care", false, "يحمي اللون بعد الغسل", "protects the color after washing", ["بلسم شعر مصبوغ", "ماسك شعر مصبوغ", "color mask"]),
    ];
  }
  if (state.concern === "dry" && hair) {
    return [
      routineStep("wash", false, "ينظف بلطف بدون ما ينشف الشعر", "cleans without drying the hair", ["شامبو شعر جاف", "dry hair shampoo"]),
      routineStep("care", false, "يرجع الرطوبة بعد الغسل", "puts moisture back after washing", ["ماسك شعر جاف", "زيت شعر جاف", "hair mask"]),
    ];
  }
  if (state.concern === "oily" && state.kind === "shampoo") {
    return [
      routineStep("wash", false, "ينظف الزيادة بدون ما يهيّج الفروة", "cleans excess oil without irritating the scalp", ["شامبو شعر دهني", "oily hair shampoo"]),
      routineStep("treat", false, "يوازن الفروة بين الغسلات", "balances the scalp between washes", ["تونيك فروة", "سيروم دهني", "scalp tonic"]),
    ];
  }
  if (state.concern === "pigment") {
    return [
      routineStep("wash", false, "ينظف البشرة حتى العلاج يشتغل", "cleans skin so the treatment can work", ["غسول تفتيح", "brightening cleanser"]),
      routineStep("treat", false, "يشتغل على البقع أعمق من الكريم", "works on dark spots deeper than a cream", ["سيروم تفتيح", "brightening serum"]),
      routineStep("care", false, "يرطب ويثبت التفتيح", "moisturizes and holds the brightening", ["كريم تفتيح", "brightening cream"]),
    ];
  }
  if (state.concern === "acne") {
    return [
      routineStep("wash", false, "ينظف بلطف حتى ما تزيد الإفرازات", "cleans gently so oil does not rebound", ["غسول حبوب", "acne cleanser"]),
      routineStep("treat", false, "يعالج الحبة نفسها", "treats the spot itself", ["سيروم حبوب", "acne serum"]),
      routineStep("care", false, "يرطب خفيف حتى البشرة ما تنشف وتفرز زيادة", "a light moisturizer so skin does not dry and produce more oil", ["مرطب حبوب", "oil free moisturizer"]),
    ];
  }
  if (state.concern === "sensitive") {
    return [
      routineStep("wash", false, "تنظيف لطيف بدون ما يهيّج", "a gentle cleanse", ["غسول بشرة حساسة", "sensitive cleanser"]),
      routineStep("care", false, "يرطب ويهدئ بعد الغسل", "moisturizes and calms after cleansing", ["كريم بشرة حساسة", "sensitive cream"]),
    ];
  }
  if (state.concern === "dry" && !hair) {
    return [
      routineStep("wash", false, "ينظف بدون ما يسحب الترطيب", "cleans without stripping moisture", ["غسول بشرة جافة", "hydrating cleanser"]),
      routineStep("care", false, "يحبس الرطوبة", "seals moisture in", ["كريم مرطب", "moisturizer dry skin"]),
    ];
  }
  if (state.concern === "oily" && !hair) {
    return [
      routineStep("wash", false, "ينظف الدهون بلطف", "cleans oil gently", ["غسول بشرة دهنية", "oil control cleanser"]),
      routineStep("treat", true, "ينظم الإفرازات", "helps regulate oil", ["سيروم دهني", "niacinamide serum"]),
      routineStep("care", false, "مرطب خفيف حتى ما تفرز البشرة زيادة", "a light moisturizer so skin does not produce more oil", ["مرطب خفيف", "gel moisturizer"]),
    ];
  }
  return null;
}

export function routineRoles(state: ShoppingState): RoutineRole[] | null {
  const plan = routinePlan(state);
  return plan ? plan.map((step) => step.role) : null;
}

export function wantsRoutine(state: ShoppingState, message: string) {
  if (/منتج واحد|فقط الشامبو|الشامبو فقط|بس الشامبو|الشامبو بس|shampoo only/i.test(message)) return false;
  return routinePlan(state) != null;
}

export function companionQueries(state: ShoppingState): string[] {
  const plan = routinePlan(state);
  if (!plan) return [];
  const primary: RoutineRole | null = state.kind === "shampoo" || state.kind === "cleanser"
    ? "wash"
    : state.kind === "serum"
      ? "treat"
      : state.kind === "mask" || state.kind === "cream" || state.kind === "moisturizer"
        ? "care"
        : null;
  return plan.filter((step) => step.role !== primary).flatMap((step) => step.queries).slice(0, 6);
}

export function productRole(row: { nameAr: string; nameEn: string; tags?: ProductTagLite }): RoutineRole | "other" {
  const name = `${row.nameAr} ${row.nameEn}`;
  if (/سبلاش|splash|بودي ميست|body mist|body spray|معطر جسم/i.test(name)) return "other";
  if (/واقي|sunscreen|\bspf\b/i.test(name)) return "protect";
  if (/شامبو|shampoo|غسول|cleanser|face wash/i.test(name)) return "wash";
  if (/بخاخ|سبراي|spray|تونيك|tonic|امبول|ampoule|سيروم|serum|لوشن فروة|scalp/i.test(name)) return "treat";
  if (/بلسم|ماسك(?!ارا)|conditioner|hair mask|زيت|كريم|cream|مرطب|moistur/i.test(name)) return "care";
  const tagged = row.tags?.role;
  if (tagged === "wash" || tagged === "treat" || tagged === "care" || tagged === "protect") return tagged;
  return "other";
}

const KIND_ALIASES: Partial<Record<ProductKind, string[]>> = {
  shampoo: ["shampoo"],
  mask: ["mask"],
  serum: ["serum"],
  cream: ["cream", "moisturizer"],
  moisturizer: ["moisturizer", "cream"],
  cleanser: ["cleanser"],
  sunscreen: ["sunscreen"],
  perfume: ["perfume"],
  splash: ["splash"],
  lipstick: ["lipstick", "makeup"],
};

/** يرفض نتيجة البحث بالمعنى إذا نوعها مو المطلوب، مثل كريم بطلب شامبو. */
export function kindFits(row: { nameAr: string; nameEn: string; tags?: ProductTagLite }, state: ShoppingState) {
  if (state.kind === "other") return true;
  const named = detectKind(`${row.nameAr} ${row.nameEn}`.toLowerCase());
  if (named) return named === state.kind || (state.kind === "cream" && named === "moisturizer") || (state.kind === "moisturizer" && named === "cream");
  const tagged = row.tags?.kind;
  if (!tagged) return true;
  return (KIND_ALIASES[state.kind] ?? []).includes(tagged);
}

export function stepLabel(role: RoutineRole | "other", lang: "ar" | "en") {
  if (lang === "en") return role === "wash" ? "Cleanse" : role === "treat" ? "Treat" : role === "care" ? "Nourish" : role === "protect" ? "Protect" : "";
  return role === "wash" ? "تنظيف" : role === "treat" ? "علاج" : role === "care" ? "ترطيب وتغذية" : role === "protect" ? "حماية" : "";
}

export function orderedByStep<T extends { nameAr: string; nameEn: string; tags?: ProductTagLite }>(rows: T[]): T[] {
  const rank = (row: T) => {
    const index = ROLE_ORDER.indexOf(productRole(row) as RoutineRole);
    return index < 0 ? 9 : index;
  };
  return [...rows].sort((a, b) => rank(a) - rank(b));
}

export function stepToReplace(message: string): RoutineRole | null {
  const text = message.toLowerCase();
  if (/براند|ماركة|brand/.test(text)) return null;
  const replacing = /بدل|بدلي|غيري|غيّري/.test(text) || /غير (البخاخ|السيروم|الشامبو|الغسول|الماسك|الزيت|البلسم|الكريم|المرطب|العلاج|الخطوة)/.test(text);
  if (!replacing) return null;
  if (/بخاخ|سيروم|علاج|تونيك|امبول|الخطوة الثانية|الثاني/.test(text)) return "treat";
  if (/واقي|الخطوة الرابعة/.test(text)) return "protect";
  if (/شامبو|غسول|الخطوة الاولى|الخطوة الأولى|الاول|الأول/.test(text)) return "wash";
  if (/ماسك|زيت|بلسم|كريم|مرطب|الخطوة الثالثة|الثالث/.test(text)) return "care";
  return null;
}

export function replaceStep<T extends { nameAr: string; nameEn: string }>(shown: T[], role: RoutineRole, next: T): T[] {
  const index = shown.findIndex((item) => productRole(item) === role);
  if (index < 0) return [...shown, next];
  return shown.map((item, itemIndex) => (itemIndex === index ? next : item));
}

export function askedStep(message: string): RoutineRole | "all" | null {
  const text = message.toLowerCase();
  if (!/ليش|لماذا|وضح|اشرح|شنو الفرق|الفرق|يفرق|ينفع|يفيد/.test(text)) return null;
  if (/بخاخ|سيروم|علاج|تونيك|امبول/.test(text)) return "treat";
  if (/شامبو|غسول/.test(text)) return "wash";
  if (/ماسك|زيت|بلسم|كريم|مرطب|واقي/.test(text)) return "care";
  if (/الفرق|ويا بعض|الاثنين|الثنين|كلهم|الخطوات/.test(text)) return "all";
  return null;
}

export function isRoutineUsage(message: string) {
  const text = message.toLowerCase();
  if (!/استخدم|استخدام|استعمل|ويا بعض|مع بعض|الروتين/.test(text)) return false;
  return /هم|بعض|الروتين|كلهم|الخطوتين|الثلاث|ترتيب/.test(text);
}

function companyKey(row: { brand?: string }) {
  const raw = row.brand?.trim();
  if (!raw) return "";
  return canonicalBrand(raw);
}

/** يبدّل خطوة ويبقى على نفس الشركة إذا عندها بديل يعالج نفس المشكلة. */
export function preferCompanyPick<T extends MatchRow>(
  ranked: Array<{ row: T; score: number }>,
  slot: RoutineRole,
  anchorBrand?: string,
): T | undefined {
  const fits = ranked.filter((item) => productRole(item.row) === slot);
  if (anchorBrand) {
    const same = fits.find((item) => companyKey(item.row) === companyKey({ brand: anchorBrand }) && item.score >= 6);
    if (same) return same.row;
  }
  return fits[0]?.row;
}

/** منتج واحد لكل خطوة. إذا شركة واحدة تغطي العلاج نلتزم بيها، وإلا نجمع من أكثر من شركة. */
export function consultPicks<T extends MatchRow>(rows: T[], state: ShoppingState): T[] {
  const plan = routinePlan(state);
  if (!plan) return rankMatches(rows, state).slice(0, 2);

  const pools = new Map<RoutineRole, Array<{ row: T; score: number }>>();
  for (const step of plan) {
    const ranked = scoredMatches(rows.filter((row) => productRole(row) === step.role), state);
    pools.set(step.role, step.optional ? ranked.filter((item) => item.score >= 6) : ranked);
  }
  const required = plan.filter((step) => !step.optional);
  const brands = new Set<string>();
  for (const list of pools.values()) {
    for (const item of list) {
      const key = companyKey(item.row);
      if (key) brands.add(key);
    }
  }
  const bestOf = (role: RoutineRole, brand: string | null, minScore: number) => {
    const list = pools.get(role) ?? [];
    return list.find((item) => item.score >= minScore && (brand == null || companyKey(item.row) === brand));
  };

  let chosen: string | null = null;
  let bestCover = 1;
  let bestQuality = -1;
  let bestPrice = 0;
  for (const brand of brands) {
    const hits = required
      .map((step) => bestOf(step.role, brand, 6))
      .filter((item): item is { row: T; score: number } => Boolean(item));
    if (hits.length < 2) continue;
    const liked = state.preferBrands?.some((name) => canonicalBrand(name) === brand) ? 3 : 0;
    const quality = hits.reduce((sum, item) => sum + item.score, 0) + liked;
    const price = hits.reduce((sum, item) => sum + item.row.price, 0);
    const betterCover = hits.length > bestCover;
    const betterQuality = hits.length === bestCover && quality > bestQuality;
    const sameQuality = hits.length === bestCover && quality === bestQuality;
    const betterPrice = sameQuality && state.priceTier === "premium" && price > bestPrice;
    const cheaper = sameQuality && state.priceTier === "value" && (bestPrice === 0 || price < bestPrice);
    if (betterCover || betterQuality || betterPrice || cheaper) {
      chosen = brand;
      bestCover = hits.length;
      bestQuality = quality;
      bestPrice = price;
    }
  }

  const picked: T[] = [];
  for (const step of plan) {
    const hit = (chosen ? bestOf(step.role, chosen, 6) : undefined)
      ?? bestOf(step.role, null, 6)
      ?? bestOf(step.role, null, 3)
      ?? (pools.get(step.role) ?? [])[0];
    if (!hit) continue;
    if (step.optional && hit.score < 6) continue;
    if (picked.some((row) => row.id === hit.row.id)) continue;
    picked.push(hit.row);
  }
  if (!picked.length) return rankMatches(rows, state).slice(0, 1);
  return picked.slice(0, 3);
}

export function adviceBrief(state: ShoppingState, rows: MatchRow[]) {
  const plan = routinePlan(state) ?? [];
  const lines = rows.map((row) => {
    const role = productRole(row);
    const step = plan.find((item) => item.role === role);
    const why = step?.whyAr ?? "خيار";
    return `${why}=${row.nameAr || row.nameEn}`;
  });
  const missing = plan
    .filter((step) => !step.optional && !rows.some((row) => productRole(row) === step.role))
    .map((step) => step.whyAr);
  const price = state.priceTier === "premium" ? "تريد الغالي داخل كل خطوة، فلا تبدلينه بالأرخص." : state.priceTier === "value" ? "تريد الرخيص داخل كل خطوة." : "";
  return [
    lines.join("، "),
    missing.length ? `ناقص: ${missing.join(" و")}` : "",
    "اشرحي المشكلة أول، ثم كل خطوة بالترتيب وسعرها المكتوب. إذا مكتوبة طريقة استخدام قصيرة اذكريها. إذا الخطوات من شركة واحدة قولي اسمها. إذا من أكثر من شركة قولي ماكو خط كامل من شركة واحدة. لا تشخصين مرض ولا تخترعين مكون.",
    price,
  ].filter(Boolean).join(" ");
}

function productName(row: MatchRow, lang: "ar" | "en") {
  return lang === "en" ? row.nameEn || row.nameAr : row.nameAr || row.nameEn;
}

function usageHint(row: MatchRow) {
  const text = row.howToUse?.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const sentence = text.split(/[.!؟\n]/)[0]?.trim() ?? "";
  if (sentence.length < 8) return "";
  return sentence.slice(0, 90);
}

function writtenFact(row: MatchRow) {
  const raw = [row.description, row.ingredients].filter(Boolean).join(". ").replace(/\s+/g, " ").trim();
  if (raw.length < 12) return "";
  const sentence = raw.split(/[.!؟\n]/)[0]?.trim() ?? "";
  if (sentence.length < 12) return "";
  return sentence.slice(0, 110);
}

function problemIntro(state: ShoppingState, lang: "ar" | "en", missing: RoutineRole[]) {
  const gap = (role: RoutineRole) => {
    if (lang === "en") {
      if (role === "treat") return "There is no spray or serum for this in the store.";
      if (role === "wash") return "There is no cleanser or shampoo for this step.";
      return "There is no matching care step in the store.";
    }
    if (role === "treat") return "ما لقيت بخاخ أو سيروم لنفس المشكلة بالمتجر.";
    if (role === "wash") return state.kind === "shampoo" || state.concern === "hairloss" ? "ما لقيت شامبو مناسب بالمتجر." : "ما لقيت غسول مناسب بالمتجر.";
    return "ما لقيت خطوة الترطيب أو التغذية بالمتجر.";
  };
  const extra = missing.map(gap).join(" ");
  if (lang === "en") {
    if (state.concern === "hairloss") return `Hair loss is not fixed by shampoo alone. Shampoo stays on the scalp for minutes, and the treatment is what stays between washes. ${extra}`.trim();
    if (state.concern === "pigment") return `Brightening is a cleanser, then a serum, then a cream. Daytime sunscreen matters so spots do not come back. ${extra}`.trim();
    if (state.concern === "acne") return `Spots usually come back if you only use one product. Cleanse, treat, and use a light moisturizer together. ${extra}`.trim();
    return extra;
  }
  if (state.concern === "hairloss") {
    const oily = state.also?.includes("oily") ? " الفروة الدهنية تحتاج شامبو خفيف حتى ما يثقل الشعر." : "";
    const colored = state.also?.includes("colored") ? " وبدون منتجات قاسية تسحب اللون." : "";
    const dry = state.also?.includes("dry") ? " والشعر الجاف يحتاج ترطيب بعد الغسل." : "";
    return `التساقط ما ينحل بشامبو بس. الشامبو يبقى دقائق على الفروة، والعلاج هو اللي يظل عليها بين الغسلات.${oily}${colored}${dry} ${extra}`.trim();
  }
  if (state.concern === "dandruff") return `القشرة تحتاج شامبو يقشرها وعلاج يهدّي الفروة بين الغسلات. ${extra}`.trim();
  if (state.concern === "pigment") return `التفتيح غسول ثم سيروم ثم كريم، مو كريم لحاله. وبالنهار الواقي ضروري حتى البقع ما ترجع. ${extra}`.trim();
  if (state.concern === "acne") return `الحبوب إذا تعالجينها بمنتج واحد غالباً يا تنشف البشرة يا ترجع. التنظيف والعلاج والترطيب الخفيف يشتغلون ويا بعض. ${extra}`.trim();
  if (state.concern === "sensitive") return `البشرة الحساسة تحتاج خطوات لطيفة، مو منتج قوي واحد. ${extra}`.trim();
  if (state.concern === "dry") return `الجفاف ما ينحل بمنتج واحد. التنظيف اللطيف والترطيب بعده يكملون بعض. ${extra}`.trim();
  if (state.concern === "oily") return `الدهون إذا تنشّفينها بقوة ترجع أقوى. التنظيف اللطيف والعلاج والمرطب الخفيف أحسن. ${extra}`.trim();
  if (state.concern === "colored") return `الشعر المصبوغ يحتاج غسل لطيف وحماية للون بعده. ${extra}`.trim();
  return extra;
}

export function consultantReply(lang: "ar" | "en", state: ShoppingState, rows: MatchRow[]) {
  const plan = routinePlan(state);
  if (!plan || !rows.length) return "";
  const ordered = [...rows].sort((a, b) => ROLE_ORDER.indexOf(productRole(a) as RoutineRole) - ROLE_ORDER.indexOf(productRole(b) as RoutineRole));
  const missing = plan
    .filter((step) => !step.optional && !ordered.some((row) => productRole(row) === step.role))
    .map((step) => step.role);
  const remembered = state.fromProfile && state.profileNote && lang === "ar" ? `اخترت على أساس إن ${state.profileNote} مثل ما قلتيلي.` : "";
  const intro = [remembered, problemIntro(state, lang, missing)].filter(Boolean).join(" ");
  const lines = ordered.map((row) => {
    const step = plan.find((item) => item.role === productRole(row));
    const why = step ? (lang === "en" ? step.whyEn : step.whyAr) : "";
    const hint = usageHint(row);
    const fact = writtenFact(row);
    const money = row.price.toLocaleString("en-US");
    const detail = [fact, hint ? (lang === "en" ? `Use: ${hint}` : `الاستخدام: ${hint}`) : ""].filter(Boolean).join(" ");
    return lang === "en"
      ? `${why}: ${productName(row, lang)} at ${money} IQD.${detail ? ` ${detail}` : ""}`
      : `${why}: ${productName(row, lang)} بسعر ${money} دينار.${detail ? ` ${detail}` : ""}`;
  });
  const close = lang === "en" ? "Use them in this order." : "استخدميهم بهذا الترتيب.";
  return [intro, ...lines, ordered.length > 1 ? close : "", lineupNote(ordered, lang)].filter(Boolean).join(" ");
}

function lineupNote(rows: MatchRow[], lang: "ar" | "en") {
  if (rows.length < 2 || rows.some((row) => !companyKey(row))) return "";
  const keys = [...new Set(rows.map((row) => companyKey(row)))];
  if (keys.length === 1) {
    const label = rows.find((row) => companyKey(row) === keys[0])?.brand?.trim() || keys[0];
    return lang === "en" ? `These are from ${label}, so the routine stays one company.` : `هذول من شركة ${label} حتى العلاج يبقى خط واحد.`;
  }
  return lang === "en"
    ? "No single company has the full routine, so these steps come from more than one brand."
    : "ما لقيت خط كامل من شركة واحدة، فجمعت الخطوات من أكثر من شركة.";
}

export function stepAnswer(lang: "ar" | "en", state: ShoppingState, rows: MatchRow[], focus: RoutineRole | "all") {
  if (focus === "all") return consultantReply(lang, state, rows);
  const row = rows.find((item) => productRole(item) === focus);
  if (!row) return "";
  const step = routinePlan(state)?.find((item) => item.role === focus);
  const why = step ? (lang === "en" ? step.whyEn : step.whyAr) : "";
  const fact = writtenFact(row);
  const hint = usageHint(row);
  const name = productName(row, lang);
  const money = row.price.toLocaleString("en-US");
  return [
    lang === "en" ? `${name} is ${money} IQD.` : `${name} سعره ${money} دينار.`,
    why,
    fact,
    hint ? (lang === "en" ? `Use: ${hint}` : `الاستخدام المكتوب: ${hint}`) : "",
  ].filter(Boolean).join(" ");
}

export function usageReply(lang: "ar" | "en", rows: MatchRow[]) {
  const ordered = [...rows].sort((a, b) => ROLE_ORDER.indexOf(productRole(a) as RoutineRole) - ROLE_ORDER.indexOf(productRole(b) as RoutineRole));
  const intro = lang === "en" ? "Use them in this order, cleanse then treat." : "استخدميهم بهذا الترتيب: تنظيف، وبعده علاج، وبعده ترطيب.";
  const lines = ordered.map((row) => {
    const hint = usageHint(row);
    const name = productName(row, lang);
    if (hint) return `${name}: ${hint}`;
    const role = productRole(row);
    if (lang === "en") return `${name}: use it in the ${role} step.`;
    if (role === "wash") return `${name}: هالخطوة وقت الغسل.`;
    if (role === "treat") return `${name}: خليها على الفروة أو البشرة بين الغسلات.`;
    return `${name}: هالخطوة بعد التنظيف.`;
  });
  return [intro, ...lines].join(" ");
}
