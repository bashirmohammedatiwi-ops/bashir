/**
 * Rolling conversation summarization (task rule #19): when history grows,
 * compress OLD turns into a short durable summary that preserves product
 * references, preferences, exclusions, budget, and pending intentions —
 * while the recent window still passes verbatim.
 */

import { Inject, Injectable, Logger } from "@nestjs/common";
import { AI_PROVIDER, type AIProvider } from "../ai/ai-provider.interface";

const SUMMARIZE_EVERY = 10; // summarize when USER message count crosses a multiple
const MAX_SUMMARY_CHARS = 900;

@Injectable()
export class SummarizerService {
  private readonly logger = new Logger(SummarizerService.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AIProvider) {}

  shouldSummarize(userMessageCount: number): boolean {
    return userMessageCount > 0 && userMessageCount % SUMMARIZE_EVERY === 0;
  }

  /**
   * Produces a compact summary from the older turns. Failure is non-fatal —
   * the assistant simply continues without an updated summary.
   */
  async summarize(previousSummary: string | null, olderTurns: Array<{ role: string; content: string }>, fastModel: string): Promise<string | null> {
    if (!olderTurns.length) return previousSummary;
    const transcript = olderTurns
      .slice(-24)
      .map((t) => `${t.role === "USER" ? "USER" : "ASSISTANT"}: ${t.content.slice(0, 400)}`)
      .join("\n");

    try {
      const result = await this.provider.chat({
        model: fastModel,
        temperature: 0,
        maxOutputTokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You compress a shopping-assistant conversation excerpt into a short Arabic summary. " +
              "Preserve EXACTLY: product names/ids mentioned, chosen or excluded brands, budget numbers, " +
              "hard constraints vs soft preferences, pending questions, and which numbered options the user saw. " +
              "Never add facts. Max 6 lines.",
          },
          {
            role: "user",
            content: `${previousSummary ? `Existing summary:\n${previousSummary}\n\n` : ""}New turns:\n${transcript}`,
          },
        ],
      });
      const summary = result.text.trim().slice(0, MAX_SUMMARY_CHARS);
      return summary || previousSummary;
    } catch (err) {
      this.logger.warn(`summarization failed: ${(err as Error).message}`);
      return previousSummary;
    }
  }
}
