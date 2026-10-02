import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { PrismaModule } from "../../../common/prisma.module";
import { PrismaService } from "../../../common/prisma.service";
import { RedisCacheModule } from "../../../common/redis-cache.module";
import { EVAL_USER_PREFIX } from "../assistant-insights.service";
import { AssistantModule } from "../assistant.module";
import { AssistantService } from "../assistant.service";
import { EvalScenario, SCENARIOS, TurnCheck } from "./scenarios";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, RedisCacheModule, AssistantModule],
})
class EvalModule {}

type Card = { id?: string; name?: string; nameAr?: string; nameEn?: string; price?: number; brand?: { name?: string } | null };
type Reply = { reply: string; products: Card[]; suggestions: string[] };

const TURN_TIMEOUT_MS = 90_000;

function cardText(card: Card) {
  return [card.nameAr, card.nameEn, card.name, card.brand?.name].filter(Boolean).join(" ");
}

function check(expect: TurnCheck, res: Reply, previous: Card[]): string[] {
  const problems: string[] = [];
  const count = res.products.length;
  if (expect.products?.min != null && count < expect.products.min) problems.push(`عرضت ${count} منتجات، المتوقع ${expect.products.min} على الأقل`);
  if (expect.products?.max != null && count > expect.products.max) problems.push(`عرضت ${count} منتجات، المتوقع ${expect.products.max} كحد أقصى`);
  if (expect.clarify && (count > 0 || res.suggestions.length < 2)) problems.push("ما سألت توضيح باختيارات");
  if (expect.suggestionsInclude && !res.suggestions.some((item) => item.includes(expect.suggestionsInclude!))) {
    problems.push(`الاختيارات ما بيها «${expect.suggestionsInclude}»`);
  }
  if (expect.namesMatch && count > 0 && !res.products.some((card) => new RegExp(expect.namesMatch!, "i").test(cardText(card)))) {
    problems.push(`ولا منتج يطابق ${expect.namesMatch}`);
  }
  if (expect.namesAvoid) {
    const bad = res.products.filter((card) => new RegExp(expect.namesAvoid!, "i").test(cardText(card)));
    if (bad.length) problems.push(`منتج ممنوع: ${bad.map(cardText).join(" | ")}`);
  }
  if (expect.maxPrice != null) {
    const over = res.products.filter((card) => Number(card.price ?? 0) > expect.maxPrice!);
    if (over.length) problems.push(`فوق الميزانية: ${over.map((card) => `${cardText(card)} ${card.price}`).join(" | ")}`);
  }
  if (expect.cheaperThanPrevious && previous.length && count) {
    const floor = Math.min(...previous.map((card) => Number(card.price ?? 0)));
    const pricey = res.products.filter((card) => Number(card.price ?? 0) >= floor);
    if (pricey.length) problems.push(`مو أرخص من ${floor}: ${pricey.map((card) => card.price).join(", ")}`);
  }
  if (expect.noOverlapWithPrevious && count) {
    const seen = new Set(previous.map((card) => card.id));
    const repeated = res.products.filter((card) => seen.has(card.id));
    if (repeated.length) problems.push(`كررت منتجات سبق عرضها: ${repeated.map(cardText).join(" | ")}`);
  }
  if (expect.replyMatches && !new RegExp(expect.replyMatches, "i").test(res.reply)) problems.push(`الرد ما بيه ${expect.replyMatches}`);
  if (expect.replyAvoid && new RegExp(expect.replyAvoid).test(res.reply)) problems.push(`الرد بيه شي ممنوع: ${expect.replyAvoid}`);
  if (!res.reply.trim()) problems.push("رد فارغ");
  return problems;
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`تجاوز ${TURN_TIMEOUT_MS / 1000} ثانية`)), TURN_TIMEOUT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runScenario(service: AssistantService, scenario: EvalScenario, index: number) {
  const userId = `${EVAL_USER_PREFIX}${index}:${Date.now()}`;
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  let previous: Card[] = [];
  const problems: string[] = [];
  for (const turn of scenario.turns) {
    if (turn.fresh) {
      history.length = 0;
      previous = [];
    }
    let res: Reply;
    try {
      res = (await withTimeout(service.chat(userId, { message: turn.say, lang: "ar", history: [...history] }))) as unknown as Reply;
    } catch (error) {
      problems.push(`«${turn.say}» فشل: ${error instanceof Error ? error.message : error}`);
      break;
    }
    if (turn.expect) {
      for (const problem of check(turn.expect, res, previous)) problems.push(`«${turn.say}» ${problem}`);
    }
    history.push({ role: "user", content: turn.say }, { role: "assistant", content: res.reply.slice(0, 160) || "…" });
    if (res.products.length) previous = res.products;
  }
  return problems;
}

async function main() {
  const only = process.argv[2];
  const scenarios = only ? SCENARIOS.filter((item) => item.name.includes(only)) : SCENARIOS;
  const app = await NestFactory.createApplicationContext(EvalModule, { logger: ["error"] });
  const service = app.get(AssistantService);
  let failed = 0;
  let warned = 0;
  const started = Date.now();
  for (const [index, scenario] of scenarios.entries()) {
    const problems = await runScenario(service, scenario, index);
    if (!problems.length) {
      console.log(`✓ ${scenario.name}`);
      continue;
    }
    if (scenario.soft) warned += 1;
    else failed += 1;
    console.log(`${scenario.soft ? "⚠" : "✗"} ${scenario.name}`);
    for (const problem of problems) console.log(`    ${problem}`);
  }
  const passed = scenarios.length - failed - warned;
  console.log(`\nنجح ${passed} من ${scenarios.length} · فشل ${failed} · تحذير ${warned} · ${Math.round((Date.now() - started) / 1000)} ثانية`);
  console.log(`EVAL_RESULT ${JSON.stringify({ total: scenarios.length, passed, failed, warned })}`);
  await app.get(PrismaService).assistantProfile.deleteMany({ where: { userId: { startsWith: EVAL_USER_PREFIX } } }).catch(() => undefined);
  await app.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
