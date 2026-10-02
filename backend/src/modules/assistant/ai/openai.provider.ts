/**
 * OpenAI provider over raw fetch (repo convention — no SDK dependency).
 * Chat Completions API: tool calling, SSE streaming, structured outputs,
 * embeddings. Transient failures retry with exponential backoff.
 */

import { Injectable, Logger } from "@nestjs/common";
import {
  AiProviderError,
  type AIProvider,
  type ChatMessage,
  type ChatOptions,
  type ChatResult,
  type StreamHandlers,
  type ToolCallRequest,
} from "./ai-provider.interface";

const MAX_RETRIES = 2;
const EMBED_BATCH = 64;

interface OpenAiToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenAiChoice {
  delta?: { content?: string | null; tool_calls?: OpenAiToolCallDelta[] };
  message?: {
    content?: string | null;
    tool_calls?: OpenAiToolCallDelta[];
  };
  finish_reason?: string | null;
}

interface OpenAiResponse {
  choices?: OpenAiChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string; type?: string };
}

@Injectable()
export class OpenAiProvider implements AIProvider {
  readonly name = "openai";
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  async chat(options: ChatOptions, handlers: StreamHandlers = {}): Promise<ChatResult> {
    const stream = Boolean(handlers.onDelta);
    const body = this.buildBody(options, stream);
    let attempt = 0;

    for (;;) {
      attempt += 1;
      try {
        const signals: AbortSignal[] = [AbortSignal.timeout(this.timeoutMs)];
        if (handlers.signal) signals.push(handlers.signal);
        const signal = typeof AbortSignal.any === "function" ? AbortSignal.any(signals) : signals[0];
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal,
        });

        if (res.status === 429 || res.status >= 500) {
          if (attempt <= MAX_RETRIES) {
            await this.backoff(attempt);
            continue;
          }
          throw new AiProviderError(`provider HTTP ${res.status}`, res.status === 429 ? "RATE_LIMIT" : "AI_PROVIDER_ERROR", true);
        }

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as OpenAiResponse;
          throw new AiProviderError(err.error?.message ?? `provider HTTP ${res.status}`, "AI_PROVIDER_ERROR", false);
        }

        if (stream && res.body) {
          return await this.consumeStream(res, options.model, handlers);
        }

        const json = (await res.json()) as OpenAiResponse;
        const choice = json.choices?.[0];
        const message = choice?.message;
        const toolCalls = this.normalizeToolCalls(message?.tool_calls ?? []);
        return {
          text: message?.content ?? "",
          toolCalls,
          usage: {
            inputTokens: json.usage?.prompt_tokens ?? 0,
            outputTokens: json.usage?.completion_tokens ?? 0,
          },
          model: options.model,
          finishReason: choice?.finish_reason ?? "stop",
        };
      } catch (err) {
        if (err instanceof AiProviderError) throw err;
        const isTimeout = (err as Error).name === "TimeoutError" || /abort/i.test((err as Error).message);
        if (isTimeout && attempt <= MAX_RETRIES) {
          await this.backoff(attempt);
          continue;
        }
        throw new AiProviderError(
          (err as Error).message || "provider request failed",
          isTimeout ? "TIMEOUT" : "AI_PROVIDER_ERROR",
          isTimeout,
        );
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH) {
      const batch = texts.slice(i, i + EMBED_BATCH);
      let attempt = 0;
      for (;;) {
        attempt += 1;
        try {
          const res = await fetch(`${this.baseUrl}/embeddings`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify({ model: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: batch }),
            signal: AbortSignal.timeout(this.timeoutMs),
          });
          if (res.status === 429 || res.status >= 500) {
            if (attempt <= MAX_RETRIES) {
              await this.backoff(attempt);
              continue;
            }
          }
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as OpenAiResponse;
            throw new AiProviderError(err.error?.message ?? `embeddings HTTP ${res.status}`, "AI_PROVIDER_ERROR", res.status === 429);
          }
          const json = (await res.json()) as { data?: Array<{ embedding: number[]; index: number }> };
          const vectors = [...(json.data ?? [])].sort((a, b) => a.index - b.index).map((d) => d.embedding);
          if (vectors.length !== batch.length) {
            throw new AiProviderError("embeddings count mismatch", "INVALID_RESPONSE", false);
          }
          out.push(...vectors);
          break;
        } catch (err) {
          if (err instanceof AiProviderError && err.transient && attempt <= MAX_RETRIES) {
            await this.backoff(attempt);
            continue;
          }
          throw err instanceof AiProviderError ? err : new AiProviderError((err as Error).message, "AI_PROVIDER_ERROR", false);
        }
      }
    }
    return out;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private buildBody(options: ChatOptions, stream: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages.map(toWireMessage),
      stream,
    };
    if (options.tools?.length) body.tools = options.tools;
    if (options.structured && !options.tools?.length) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: options.structured.name, strict: true, schema: options.structured.schema },
      };
    }
    if (options.temperature !== undefined) body.temperature = options.temperature;
    if (options.maxOutputTokens) body.max_tokens = options.maxOutputTokens;
    return body;
  }

  private normalizeToolCalls(deltas: OpenAiToolCallDelta[]): ToolCallRequest[] {
    const merged = new Map<number, ToolCallRequest>();
    for (const delta of deltas) {
      const current = merged.get(delta.index) ?? { id: "", name: "", arguments: "" };
      if (delta.id) current.id = delta.id;
      if (delta.function?.name) current.name += delta.function.name;
      if (delta.function?.arguments) current.arguments += delta.function.arguments;
      merged.set(delta.index, current);
    }
    return [...merged.values()].filter((c) => c.id && c.name);
  }

  private async consumeStream(res: Response, model: string, handlers: StreamHandlers): Promise<ChatResult> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    const toolCallDeltas: OpenAiToolCallDelta[] = [];
    let finishReason = "stop";
    let usage = { inputTokens: 0, outputTokens: 0 };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as OpenAiResponse & { usage?: { prompt_tokens?: number; completion_tokens?: number } };
          const choice = json.choices?.[0];
          if (choice?.delta?.content) {
            text += choice.delta.content;
            handlers.onDelta?.(choice.delta.content);
          }
          if (choice?.delta?.tool_calls) toolCallDeltas.push(...choice.delta.tool_calls);
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          if (json.usage) {
            usage = {
              inputTokens: json.usage.prompt_tokens ?? usage.inputTokens,
              outputTokens: json.usage.completion_tokens ?? usage.outputTokens,
            };
          }
        } catch {
          this.logger.warn("Failed to parse stream chunk — skipping");
        }
      }
    }

    return {
      text,
      toolCalls: this.normalizeToolCalls(toolCallDeltas),
      usage,
      model,
      finishReason,
    };
  }

  private async backoff(attempt: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, Math.min(8_000, 500 * 2 ** (attempt - 1))));
  }
}

function toWireMessage(message: ChatMessage): Record<string, unknown> {
  const wire: Record<string, unknown> = { role: message.role, content: message.content };
  if (message.toolCallId) wire.tool_call_id = message.toolCallId;
  if (message.toolCalls?.length) {
    wire.tool_calls = message.toolCalls.map((call) => ({
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: call.arguments },
    }));
  }
  return wire;
}
