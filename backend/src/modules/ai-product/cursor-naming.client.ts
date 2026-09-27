import { Injectable, Logger } from "@nestjs/common";

export type CursorNameDraft = {
  brand_ar: string;
  brand_en: string;
  name_ar: string;
  name_en: string;
};

export type CursorNamingInput = CursorNameDraft & {
  barcode: string;
  dbTitle?: string;
  dbBrand?: string;
  quantity?: string;
  imageTitles?: string[];
  hint?: string;
  extraContext?: string;
};

export type CursorNamingOutput = CursorNameDraft & {
  model: string;
  modelChoice: string;
  fast: boolean;
  verified: boolean;
  runtime: "cloud" | "none";
};

export type CursorShadeRow = {
  barcode: string;
  code: string;
  name_en: string;
  name_ar: string;
};

type CursorModelResolved = {
  choice: string;
  apiModel: string;
  fast: boolean;
  supportsFast: boolean;
};

const CURSOR_API_BASE = "https://api.cursor.com/v1";

@Injectable()
export class CursorNamingClient {
  private readonly logger = new Logger(CursorNamingClient.name);

  hasApiKey(): boolean {
    return Boolean(this.apiKey());
  }

  resolveModel(choice?: string): CursorModelResolved {
    const raw = (choice ?? process.env.CURSOR_MODEL ?? "gpt-5.6-terra").trim();
    const key = raw.toLowerCase().replace(/_/g, "-");

    // GPT-5.6 Terra (user "tera" typo accepted) — default quality model for product naming
    if (
      key === "gpt-5.6-terra" ||
      key === "gpt-5.6-tera" ||
      key === "terra" ||
      key === "tera" ||
      key === "gpt-terra" ||
      key === "gpt-tera"
    ) {
      return { choice: "gpt-5.6-terra", apiModel: "gpt-5.6-terra", fast: false, supportsFast: false };
    }

    if (key === "gpt-5.6-sol" || key === "sol" || key === "gpt-sol") {
      return { choice: "gpt-5.6-sol", apiModel: "gpt-5.6-sol", fast: false, supportsFast: false };
    }

    if (
      key === "gpt-5.6-luna" ||
      key === "gpt-5.6-luna-low" ||
      key === "luna-low" ||
      key === "luna" ||
      key === "gpt-luna"
    ) {
      return { choice: "gpt-5.6-luna-low", apiModel: "gpt-5.6-luna", fast: false, supportsFast: false };
    }

    if (
      key === "gpt-5.6-luna-medium" ||
      key === "luna-medium" ||
      key === "luna-med" ||
      /luna[-]?med/i.test(key)
    ) {
      return { choice: "gpt-5.6-luna-medium", apiModel: "gpt-5.6-luna", fast: false, supportsFast: false };
    }

    const wantsFast =
      key === "composer-2.5-fast" ||
      key === "composer-2.5-high" ||
      key === "composer-fast" ||
      key === "fast";

    if (wantsFast) {
      return { choice: "composer-2.5-fast", apiModel: "composer-2.5", fast: true, supportsFast: true };
    }

    if (
      key === "composer-2.5-low" ||
      key === "composer-2.5" ||
      key === "composer-low" ||
      key === "composer"
    ) {
      return { choice: "composer-2.5-low", apiModel: "composer-2.5", fast: false, supportsFast: true };
    }

    // Unknown → quality default
    return { choice: "gpt-5.6-terra", apiModel: "gpt-5.6-terra", fast: false, supportsFast: false };
  }

  async verifyBilingualNames(
    input: CursorNamingInput,
    modelChoice?: string,
    maxWaitMs = 70_000,
  ): Promise<CursorNamingOutput> {
    const resolved = this.resolveModel(modelChoice);
    const key = this.apiKey();
    if (!key) {
      this.logger.warn("CURSOR_API_KEY missing — heuristic names only");
      return this.toOutput(this.fallback(input), resolved, false, "none");
    }

    const prompt = this.buildPrompt(input);
    try {
      const text = await this.runCloudAgent(
        {
          apiKey: key,
          model: resolved.apiModel,
          fast: resolved.fast,
          supportsFast: resolved.supportsFast,
          prompt,
        },
        maxWaitMs,
      );
      const parsed = this.parseNames(text);
      if (!parsed) {
        this.logger.warn(`Cursor naming JSON missing for ${input.barcode}`);
        return this.toOutput(this.fallback(input), resolved, false, "cloud");
      }
      return this.toOutput(parsed, resolved, true, "cloud");
    } catch (err) {
      this.logger.warn(`Cursor naming failed for ${input.barcode}: ${(err as Error).message}`);
      return this.toOutput(this.fallback(input), resolved, false, "none");
    }
  }

  /** Polish shade names for a makeup family (one JSON batch). */
  async verifyShadeFamilyNames(
    input: {
      brand_en: string;
      brand_ar: string;
      product_en: string;
      hint?: string;
      shades: Array<{ barcode: string; code: string; name_en: string; db_title?: string }>;
    },
    modelChoice?: string,
    maxWaitMs = 24_000,
  ): Promise<CursorShadeRow[] | null> {
    const resolved = this.resolveModel(modelChoice);
    const key = this.apiKey();
    if (!key || !input.shades.length) return null;

    const lines = input.shades
      .map(
        (s) =>
          `barcode=${s.barcode} code=${s.code} draft_en=${s.name_en || "none"} db=${s.db_title || "none"}`,
      )
      .join("\n");

    const prompt = `You are a beauty catalog specialist for Al Hayaa (Iraq).
Reply with JSON ONLY. No markdown. No code fences. Do not use tools.

Task: For each barcode, return the OFFICIAL shade/color name (English + Arabic) for this makeup product family.
Product: ${input.brand_en} ${input.product_en}
Staff hint: ${input.hint?.trim() || "none"}

Rules:
- name_en = color/shade name only (e.g. "Romantic Red", "Pink Desire") — NOT "Shade 01".
- Include shade code/number in name_en when standard (e.g. "01 Romantic Red").
- name_ar = Arabic color name + code if present (e.g. "01 أحمر رومانسي").
- Use real cosmetic shade names when inferable from db_title or product line; never generic "Shade N".
- If truly unknown, use descriptive color guess from code order (still not "Shade 01").

Shades:
${lines}

Return exactly:
{"shades":[{"barcode":"","code":"","name_en":"","name_ar":""}]}`;

    try {
      const text = await this.runCloudAgent(
        {
          apiKey: key,
          model: resolved.apiModel,
          fast: resolved.fast,
          supportsFast: resolved.supportsFast,
          prompt,
        },
        maxWaitMs,
      );
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) return null;
      const obj = JSON.parse(text.slice(start, end + 1)) as {
        shades?: Array<Record<string, unknown>>;
      };
      const rows = (obj.shades ?? [])
        .map((row) => ({
          barcode: String(row.barcode ?? "").replace(/\D/g, "") || String(row.barcode ?? "").trim(),
          code: String(row.code ?? "").trim(),
          name_en: String(row.name_en ?? row.nameEn ?? "").trim(),
          name_ar: String(row.name_ar ?? row.nameAr ?? "").trim(),
        }))
        .filter((r) => r.barcode && r.name_en.length >= 2);
      return rows.length ? rows : null;
    } catch (err) {
      this.logger.warn(`Cursor shade-family naming failed: ${(err as Error).message}`);
      return null;
    }
  }

  private apiKey(): string {
    return (process.env.CURSOR_API_KEY ?? "").trim();
  }

  private toOutput(
    names: CursorNameDraft,
    resolved: CursorModelResolved,
    verified: boolean,
    runtime: "cloud" | "none",
  ): CursorNamingOutput {
    return {
      ...names,
      model: resolved.apiModel,
      modelChoice: resolved.choice,
      fast: resolved.fast,
      verified,
      runtime,
    };
  }

  private fallback(input: CursorNamingInput): CursorNameDraft {
    return {
      brand_ar: input.brand_ar,
      brand_en: input.brand_en,
      name_ar: input.name_ar,
      name_en: input.name_en,
    };
  }

  private buildPrompt(input: CursorNamingInput): string {
    const titles = (input.imageTitles ?? []).slice(0, 8).join(" | ") || "none";
    return `You are a bilingual beauty catalog specialist for Al Hayaa (Iraq market).
Reply with JSON ONLY. No markdown. No code fences. Do not use tools.

Barcode: ${input.barcode}
DB brand: ${input.dbBrand?.trim() || "none"}
DB title: ${input.dbTitle?.trim() || "none"}
Quantity: ${input.quantity?.trim() || "none"}
Staff hint: ${input.hint?.trim() || "none"}
Image titles: ${titles}
Draft brand_en: ${input.brand_en || "none"}
Draft brand_ar: ${input.brand_ar || "none"}
Draft name_en: ${input.name_en || "none"}
Draft name_ar: ${input.name_ar || "none"}
${input.extraContext ? `Extra: ${input.extraContext}` : ""}

Rules:
- Identify the REAL cosmetics product (brand + product line). Never output the barcode as the product name.
- brand_en / brand_ar = official brand only (e.g. ARTDECO). Keep Latin brand Latin in both fields when brand is Latin.
- name_en = "Brand - Product line" (family name, strip shade-only suffixes when possible).
- name_ar = same product in market Arabic, brand first when Latin.
- Prefer DB title + image titles + hint over inventing.
- If data is weak, still return best plausible beauty product name — NEVER digits-only names.

Return exactly:
{"brand_ar":"","brand_en":"","name_ar":"","name_en":""}`;
  }

  private parseNames(text: string): CursorNameDraft | null {
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) return null;
      const obj = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      const brand_ar = String(obj.brand_ar ?? obj.brandAr ?? "").trim();
      const brand_en = String(obj.brand_en ?? obj.brandEn ?? "").trim();
      const name_ar = String(obj.name_ar ?? obj.nameAr ?? "").trim();
      const name_en = String(obj.name_en ?? obj.nameEn ?? "").trim();
      if (name_ar.length < 3 && name_en.length < 3) return null;
      if (!brand_ar && !brand_en) return null;
      // Reject barcode-as-name outputs from the model
      const digits = name_en.replace(/\D/g, "") || name_ar.replace(/\D/g, "");
      if (digits.length >= 8 && (name_en === digits || name_ar === digits)) return null;
      return { brand_ar, brand_en, name_ar, name_en };
    } catch {
      return null;
    }
  }

  private async runCloudAgent(
    args: {
      apiKey: string;
      model: string;
      fast: boolean;
      supportsFast: boolean;
      prompt: string;
    },
    maxWaitMs = 70_000,
  ): Promise<string> {
    const createTimeout = Math.min(25_000, Math.max(8_000, maxWaitMs - 2_000));
    const modelBody: Record<string, unknown> = { id: args.model };
    if (args.supportsFast) {
      modelBody.params = [{ id: "fast", value: args.fast ? "true" : "false" }];
    }

    const created = await this.requestJson(
      "POST",
      "/agents",
      args.apiKey,
      {
        prompt: { text: args.prompt },
        model: modelBody,
        name: "alhayaa-name-verify",
      },
      createTimeout,
    );

    const agent = (created.agent as Record<string, unknown> | undefined) ?? created;
    const run = created.run as Record<string, unknown> | undefined;
    const agentId = String(agent.id ?? "").trim();
    const runId = String(run?.id ?? agent.latestRunId ?? "").trim();
    if (!agentId || !runId) {
      throw new Error("Cursor agent create returned no ids");
    }

    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const row = await this.requestJson(
        "GET",
        `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
        args.apiKey,
      );
      const status = String(row.status ?? "").toUpperCase();
      if (status === "FINISHED" || status === "COMPLETED") {
        return String(row.result ?? "");
      }
      if (status === "ERROR" || status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
        throw new Error(`Cursor run ${status}`);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Cursor run timed out");
  }

  private async requestJson(
    method: string,
    path: string,
    apiKey: string,
    body?: Record<string, unknown>,
    timeoutMs = 20_000,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(`${CURSOR_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = json.error as { message?: string } | string | undefined;
      const msg = typeof err === "string" ? err : err?.message || `Cursor HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  }
}
