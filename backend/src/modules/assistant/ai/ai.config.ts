/**
 * Central AI configuration for the assistant — everything comes from env,
 * nothing hardcoded (task rules #43, #107, #108).
 */

export interface AssistantAiConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  primaryModel: string;
  /** Cheap strong model — handles simple intents end-to-end (cost routing). */
  lightModel: string;
  fastModel: string;
  embeddingModel: string;
  maxToolIterations: number;
  requestTimeoutMs: number;
  retrievalLimit: number;
  throttlePerMinute: number;
  dailyUserMessageCap: number;
  debug: boolean;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadAssistantAiConfig(): AssistantAiConfig {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  return {
    enabled: process.env.AI_ASSISTANT_ENABLED !== "0" && Boolean(apiKey),
    apiKey,
    baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    primaryModel: process.env.AI_PRIMARY_MODEL ?? "gpt-5.6-terra",
    lightModel: process.env.AI_LIGHT_MODEL ?? "gpt-5.4-mini",
    fastModel: process.env.AI_FAST_MODEL ?? "gpt-5.4-mini",
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    maxToolIterations: num(process.env.AI_MAX_TOOL_ITERATIONS, 4),
    requestTimeoutMs: num(process.env.AI_REQUEST_TIMEOUT_MS, 45_000),
    retrievalLimit: num(process.env.AI_RETRIEVAL_LIMIT, 24),
    throttlePerMinute: num(process.env.AI_ASSISTANT_THROTTLE_PER_MIN, 15),
    dailyUserMessageCap: num(process.env.AI_DAILY_USER_MESSAGE_CAP, 120),
    debug: process.env.AI_DEBUG === "1",
  };
}

/**
 * Rough $/1M-token estimates per model class (mini/nano ≈ 3–10× cheaper
 * than the flagship tier). Used only for the admin cost dashboard —
 * override via env when pricing changes.
 */
export function estimateCostUsd(model: string | null | undefined, tokensIn: number, tokensOut: number): number {
  const name = (model ?? "").toLowerCase();
  const light = name.includes("mini") || name.includes("nano");
  const rates = light ? { input: 0.75, output: 4.5 } : { input: 2.5, output: 15 };
  return (tokensIn / 1_000_000) * rates.input + (tokensOut / 1_000_000) * rates.output;
}
