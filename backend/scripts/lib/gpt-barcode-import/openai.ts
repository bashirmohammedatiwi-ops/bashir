import { MINIMAL_PRODUCT_NAME_SCHEMA } from "./schema";
import type { GptMinimalResearch, GptUsage } from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
const MAX_OUTPUT_TOKENS = 400;

const SYSTEM_INSTRUCTIONS = `You are a product identification assistant for an Iraqi beauty e-commerce catalog.

TASK: Identify a product by barcode using exactly ONE web search.

RULES:
- Search query must be the barcode only.
- Return the GENERAL product-line name in Arabic and English — NOT a single shade/variant name.
- Do NOT include shade numbers, shade names, or color names in product_name_ar or product_name_en.
- Unified size may appear in the name when all variants share the same size.
- Arabic naming: brand (natural Iraqi Arabic) – product type + version/benefit + size.
- English naming: BRAND + product name + type + size (professional).
- Do NOT return: description, categories, shade lists, images, features, usage, markdown, or any text outside JSON.
- source_url: one primary source URL.
- confidence: 0–100 integer.
- needs_review: true if barcode match is uncertain.
- representative_barcode: the barcode you searched.

Example correct names for a lipstick line with 20 shades:
  AR: مايبيلين – أحمر شفاه سائل سوبر ستاي فينيل إنك 4.2 مل
  EN: Maybelline SuperStay Vinyl Ink Liquid Lipstick – 4.2 ml

Example WRONG (includes shade):
  EN: Maybelline SuperStay Vinyl Ink – 35 Cheeky`;

function countWebSearches(output: unknown[]): number {
  return output.filter((item) => {
    const row = item as { type?: string };
    return row.type === "web_search_call" || row.type === "web_search";
  }).length;
}

function extractJsonText(output: unknown[], body?: Record<string, unknown>): string {
  for (const item of output) {
    const row = item as {
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    };
    if (row.type !== "message" || !row.content) continue;
    for (const part of row.content) {
      if (part.type === "output_text" && part.text) return part.text;
      if (part.type === "text" && part.text) return part.text;
    }
  }
  const topLevel = body?.output_text;
  if (typeof topLevel === "string" && topLevel.trim()) return topLevel;
  throw new Error("No JSON text in OpenAI response output");
}

function extractUsage(body: Record<string, unknown>, webSearchCount: number): GptUsage {
  const usage = (body.usage as Record<string, number>) ?? {};
  return {
    input_tokens: usage.input_tokens ?? usage.prompt_tokens ?? 0,
    output_tokens: usage.output_tokens ?? usage.completion_tokens ?? 0,
    web_search_count: webSearchCount,
  };
}

/** Rough cost estimate — adjust if pricing changes. */
export function estimateCostUsd(inputTokens: number, outputTokens: number, webSearches: number): number {
  const inputPerM = 2.5;
  const outputPerM = 10;
  const searchCost = 0.025;
  return (inputTokens / 1_000_000) * inputPerM + (outputTokens / 1_000_000) * outputPerM + webSearches * searchCost;
}

export async function researchProductNameWithGpt(
  barcode: string,
  variantLine = false,
): Promise<{ research: GptMinimalResearch; usage: GptUsage; model: string }> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

  const modeNote = variantLine
    ? "This barcode represents ONE shade of a multi-shade product line. Return the parent product-line name without any shade/color."
    : "This is a single product without shade variants.";

  const userInput = `Barcode: ${barcode}
${modeNote}

STEP 1: Perform exactly ONE web search with query "${barcode}".
STEP 2: Return minimal JSON only.`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input: userInput,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      tools: [{ type: "web_search" }],
      text: {
        format: {
          type: "json_schema",
          name: "minimal_product_name",
          strict: true,
          schema: MINIMAL_PRODUCT_NAME_SCHEMA,
        },
      },
    }),
  });

  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = body.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `OpenAI HTTP ${res.status}`);
  }

  const output = (body.output as unknown[]) ?? [];
  const webSearchCount = countWebSearches(output);
  if (webSearchCount > 1) {
    console.warn(`  ⚠ GPT performed ${webSearchCount} web searches (expected 1)`);
  }

  const jsonText = extractJsonText(output, body);
  const research = JSON.parse(jsonText) as GptMinimalResearch;
  research.representative_barcode = barcode;
  const usage = extractUsage(body, webSearchCount);

  return { research, usage, model: OPENAI_MODEL };
}
