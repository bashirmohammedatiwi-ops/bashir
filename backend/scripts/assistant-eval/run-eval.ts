/**
 * Evaluation runner (task rules #59, #62, #112, #113): executes scenarios
 * against a live assistant API and scores deterministic assertions.
 *
 * Usage:
 *   BASE_URL=https://deemaalhayat.com npx tsx scripts/assistant-eval/run-eval.ts
 *   BASE_URL=http://localhost:3000 npx tsx scripts/assistant-eval/run-eval.ts --category=budget
 *   ... --only=gold_001,budg_003  ... --tag=results/eval-1.json
 *
 * Guests only need BASE_URL — the chat endpoint is public. The runner sends
 * one conversation per scenario ("conversation" mode keeps the id across
 * steps; "single" runs just the first step).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { evaluateAsserts, type AssistantTurnResult, type EvalScenario } from "./assertions";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface StepResult {
  message: string;
  ok: boolean;
  outcomes: Array<{ passed: boolean; detail: string }>;
}

interface ScenarioResult {
  id: string;
  category: string;
  title: string;
  passed: boolean;
  weight: number;
  steps: StepResult[];
}

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CHAT_ENDPOINT = `${BASE_URL}/api/v1/assistant/chat`;
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY ?? 4);
const REQUEST_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS ?? 90_000);

function parseArgs(): { category?: string; only?: Set<string>; outFile?: string } {
  const args = process.argv.slice(2);
  const out: { category?: string; only?: Set<string>; outFile?: string } = {};
  for (const arg of args) {
    if (arg.startsWith("--category=")) out.category = arg.split("=")[1];
    if (arg.startsWith("--only=")) out.only = new Set(arg.split("=")[1].split(","));
    if (arg.startsWith("--tag=")) out.outFile = arg.split("=")[1];
  }
  return out;
}

function loadScenarios(filter?: { category?: string; only?: Set<string> }): EvalScenario[] {
  const dir = join(__dirname, "scenarios");
  const results: EvalScenario[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const scenarios = JSON.parse(readFileSync(join(dir, file), "utf8")) as EvalScenario[];
    for (const scenario of scenarios) {
      if (filter?.category && scenario.category !== filter.category) continue;
      if (filter?.only && !filter.only.has(scenario.id)) continue;
      results.push(scenario);
    }
  }
  return results;
}

async function sendTurn(message: string, conversationId?: string): Promise<{ result: AssistantTurnResult; conversationId: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { data?: unknown };
    const payload = (body.data ?? body) as Record<string, unknown>;
    const metadata = (payload.metadata ?? {}) as Record<string, unknown>;
    return {
      conversationId: String(metadata.conversationId ?? conversationId ?? ""),
      result: {
        type: String(payload.type ?? "TEXT"),
        message: String(payload.message ?? ""),
        products: ((payload.products ?? []) as Array<Record<string, unknown>>).map((p) => ({
          name: String(p.name ?? ""),
          brandName: String(p.brandName ?? ""),
          price: Number(p.price ?? 0),
        })),
        quickReplies: (payload.quickReplies ?? []) as unknown[],
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runScenario(scenario: EvalScenario): Promise<ScenarioResult> {
  const steps: StepResult[] = [];
  const priorTurns: AssistantTurnResult[] = [];
  let conversationId: string | undefined;

  const turns = scenario.mode === "single" ? scenario.steps.slice(0, 1) : scenario.steps;
  for (let i = 0; i < turns.length; i += 1) {
    const step = turns[i];
    try {
      const { result, conversationId: nextId } = await sendTurn(step.message, conversationId);
      conversationId = nextId || conversationId;
      const outcomes = evaluateAsserts(step.expects ?? [], result, priorTurns);
      steps.push({ message: step.message, ok: outcomes.every((o) => o.passed), outcomes });
      priorTurns.push(result);
    } catch (err) {
      steps.push({
        message: step.message,
        ok: false,
        outcomes: [{ passed: false, detail: `request failed: ${(err as Error).message}` }],
      });
      break;
    }
  }

  return {
    id: scenario.id,
    category: scenario.category,
    title: scenario.title,
    passed: steps.length > 0 && steps.every((s) => s.ok),
    weight: scenario.weight ?? 1,
    steps,
  };
}

async function runPool(scenarios: EvalScenario[], concurrency: number): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < scenarios.length) {
      const scenario = scenarios[cursor++];
      process.stdout.write(`\r${results.length + 1}/${scenarios.length} (${scenario.id})…    `);
      results.push(await runScenario(scenario));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, scenarios.length) }, worker));
  process.stdout.write("\n");
  return results;
}

function summarize(results: ScenarioResult[]) {
  const byCategory = new Map<string, { passed: number; total: number; weightedPassed: number; weightedTotal: number }>();
  for (const result of results) {
    const bucket = byCategory.get(result.category) ?? { passed: 0, total: 0, weightedPassed: 0, weightedTotal: 0 };
    bucket.total += 1;
    bucket.weightedTotal += result.weight;
    if (result.passed) {
      bucket.passed += 1;
      bucket.weightedPassed += result.weight;
    }
    byCategory.set(result.category, bucket);
  }
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const passedWeight = results.filter((r) => r.passed).reduce((sum, r) => sum + r.weight, 0);
  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    passRate: results.length ? results.filter((r) => r.passed).length / results.length : 0,
    weightedPassRate: totalWeight ? passedWeight / totalWeight : 0,
    byCategory: [...byCategory.entries()].map(([category, b]) => ({
      category,
      passed: b.passed,
      total: b.total,
      rate: b.total ? b.passed / b.total : 0,
    })),
  };
}

function renderReport(results: ScenarioResult[]): string {
  const summary = summarize(results);
  const lines: string[] = [
    "# تقرير تقييم المساعد الذكي",
    "",
    `BASE_URL: ${BASE_URL}`,
    `Total: ${summary.total} | Passed: ${summary.passed} | Pass rate: ${(summary.passRate * 100).toFixed(1)}% | Weighted: ${(summary.weightedPassRate * 100).toFixed(1)}%`,
    "",
    "| Category | Passed | Total | Rate |",
    "|---|---|---|---|",
    ...summary.byCategory.map((c) => `| ${c.category} | ${c.passed} | ${c.total} | ${(c.rate * 100).toFixed(0)}% |`),
    "",
    "## Failures",
    "",
  ];
  const failures = results.filter((r) => !r.passed);
  if (!failures.length) {
    lines.push("(none 🎉)");
  }
  for (const failure of failures) {
    lines.push(`### ${failure.id} — ${failure.title}`);
    for (const step of failure.steps.filter((s) => !s.ok)) {
      lines.push(`- USER: "${step.message}"`);
      for (const outcome of step.outcomes.filter((o) => !o.passed)) {
        lines.push(`  - ✗ ${outcome.detail}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const filter = parseArgs();
  const scenarios = loadScenarios(filter);
  if (!scenarios.length) {
    console.error("No scenarios matched the filter.");
    process.exitCode = 1;
    return;
  }

  console.log(`Running ${scenarios.length} scenarios against ${CHAT_ENDPOINT}`);
  const results = await runPool(scenarios, CONCURRENCY);
  const summary = summarize(results);

  const report = renderReport(results);
  console.log("\n" + report);

  if (filter.outFile) {
    const outPath = join(__dirname, "..", "..", "..", filter.outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, report, "utf8");
    console.log(`Report saved to ${outPath}`);
  }

  // Threshold gate (rule #112): fail CI under 85% deterministic pass.
  if (summary.passRate < 0.85) {
    console.error(`\nPASS RATE ${(summary.passRate * 100).toFixed(1)}% < 85% target`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
