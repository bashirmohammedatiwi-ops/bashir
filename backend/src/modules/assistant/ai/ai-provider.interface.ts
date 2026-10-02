/**
 * Provider abstraction for the assistant's LLM access (task rule #43).
 * Implementations: OpenAIProvider (chat completions with tool calling,
 * streaming, structured outputs, embeddings).
 */

export type JsonSchemaObject = Record<string, unknown>;

/** DI tokens (interfaces cannot serve as Nest injection tokens). */
export const AI_PROVIDER = "AI_PROVIDER";
export const ASSISTANT_AI_CONFIG = "ASSISTANT_AI_CONFIG";

export interface ToolCallRequest {
  id: string;
  name: string;
  /** Raw JSON arguments string from the model — validated by the tool registry before execution. */
  arguments: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  toolCallId?: string;
  toolCalls?: ToolCallRequest[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JsonSchemaObject;
  };
}

export interface StructuredOutput {
  name: string;
  schema: JsonSchemaObject;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  structured?: StructuredOutput;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatResult {
  text: string;
  toolCalls: ToolCallRequest[];
  usage: ChatUsage;
  model: string;
  finishReason: string;
}

export interface StreamHandlers {
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  chat(options: ChatOptions, handlers?: StreamHandlers): Promise<ChatResult>;
  embed(texts: string[]): Promise<number[][]>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "AI_PROVIDER_ERROR"
      | "RATE_LIMIT"
      | "TIMEOUT"
      | "INVALID_RESPONSE",
    readonly transient: boolean,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
