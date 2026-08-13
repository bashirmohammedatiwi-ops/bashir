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

type CursorModelResolved = {
  choice: string;
  apiModel: string;
  fast: boolean;
};

const CURSOR_API_BASE = "https://api.cursor.com/v1";

@Injectable()
export class CursorNamingClient {
  private readonly logger = new Logger(CursorNamingClient.name);

  hasApiKey(): boolean {
    return Boolean(this.apiKey());
  }

  resolveModel(choice?: string): CursorModelResolved {
    const raw = (choice ?? process.env.CURSOR_MODEL ?? "composer-2.5-low").trim();
    const key = raw.toLowerCase().replace(/_/g, "-");

    const wantsFast =
      key === "composer-2.5-fast" ||
      key === "composer-2.5-high" ||
      key === "gpt-5.6-luna-medium" ||
      key === "luna-medium" ||
      key === "luna-med" ||
      /luna[-]?med/i.test(key) ||
      key === "fast";

    if (wantsFast) {
      return { choice: "composer-2.5-fast", apiModel: "composer-2.5", fast: true };
    }

    return { choice: "composer-2.5-low", apiModel: "composer-2.5", fast: false };
  }

  async verifyBilingualNames(input: CursorNamingInput, modelChoice?: string): Promise<CursorNamingOutput> {
    const resolved = this.resolveModel(modelChoice);
    const key = this.apiKey();
    if (!key) {
      this.logger.warn("CURSOR_API_KEY missing — heuristic names only");
      return this.toOutput(this.fallback(input), resolved, false, "none");
    }

    const prompt = this.buildPrompt(input);
    try {
      const text = await this.runCloudAgent({
        apiKey: key,
        model: resolved.apiModel,
        fast: resolved.fast,
        prompt,
      });
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
      brand_ar: input.brand_ar?.trim() || "",
      brand_en: input.brand_en?.trim() || "",
      name_ar: input.name_ar?.trim() || "",
      name_en: input.name_en?.trim() || "",
    };
  }

  private buildPrompt(input: CursorNamingInput): string {
    const titles = (input.imageTitles ?? []).slice(0, 6).join(" || ") || "none";
    return `You are a beauty catalog copywriter for Al Hayaa (Iraqi market).
Reply with JSON ONLY. No markdown. No code fences. Do not use tools. Do not read or write files. Do not search the web. Immediate JSON reply.

Task: verify and polish bilingual PRODUCT NAMES only (not description, not category, not shade list).

Rules:
- brand_en / brand_ar = brand name only (once).
- name_en = "{BrandEn} - {Official Product Name}" without shade number.
- name_ar = "{LatinBrandAsOnPack} - {نوع المنتج بالعربي} {اسم الخط الرسمي EN} {الحجم}"
  HARD: after the dash, the PRODUCT TYPE must be Arabic. Never copy the full English title into name_ar.
  Latin brand stays Latin only at the start (ARTDECO, Seventeen, GOSH, Maybelline, Mon Reve).
- Arabic: MSA only. No Iraqi dialect.
- Market types: cleansing mousse → موس تنظيف | cleanser → منظف | lipstick → أحمر شفاه (not روج) | lip gloss → جلوس شفاه | concealer → كونسيلر | foundation → فاونديشن | mascara → ماسكارا | blush → بلاشر | highlighter → هايلايتر | eyeliner → ايلاينر | eyeshadow → ظل عيون | brow pencil → قلم حواجب | serum → سيروم | shampoo → شامبو | ml → مل
Examples:
- name_en: "ARTDECO - Pure Silk Cleansing Mousse 150 ml"
- name_ar: "ARTDECO - موس تنظيف Pure Silk 150 مل"
- name_en: "Seventeen - Ideal Cover Liquid Concealer"
- name_ar: "Seventeen - كونسيلر Ideal Cover Liquid"

barcode=${input.barcode}
draft_brand_en=${input.brand_en || "none"}
draft_brand_ar=${input.brand_ar || "none"}
draft_name_en=${input.name_en || "none"}
draft_name_ar=${input.name_ar || "none"}
db_title=${input.dbTitle || "none"}
db_brand=${input.dbBrand || "none"}
size=${input.quantity || "none"}
image_titles=${titles}
staff_hint=${input.hint?.trim() || "none"}
${input.extraContext ? `extra=${input.extraContext}` : ""}

Return exactly:
{"brand_ar":"","brand_en":"","name_ar":"","name_en":""}`;
  }

  private parseNames(raw: string): CursorNameDraft | null {
    const text = (raw || "").trim();
    if (!text) return null;
    let jsonText = text;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) jsonText = text.slice(start, end + 1);
    try {
      const obj = JSON.parse(jsonText) as Record<string, unknown>;
      const brand_ar = String(obj.brand_ar ?? obj.brandAr ?? "").trim();
      const brand_en = String(obj.brand_en ?? obj.brandEn ?? "").trim();
      const name_ar = String(obj.name_ar ?? obj.nameAr ?? "").trim();
      const name_en = String(obj.name_en ?? obj.nameEn ?? "").trim();
      if (name_ar.length < 3 && name_en.length < 3) return null;
      if (!brand_ar && !brand_en) return null;
      return { brand_ar, brand_en, name_ar, name_en };
    } catch {
      return null;
    }
  }

  private async runCloudAgent(args: {
    apiKey: string;
    model: string;
    fast: boolean;
    prompt: string;
  }): Promise<string> {
    const created = await this.requestJson("POST", "/agents", args.apiKey, {
      prompt: { text: args.prompt },
      model: {
        id: args.model,
        params: [{ id: "fast", value: args.fast ? "true" : "false" }],
      },
      name: "alhayaa-name-verify",
    }, 25_000);

    const agent = (created.agent as Record<string, unknown> | undefined) ?? created;
    const run = created.run as Record<string, unknown> | undefined;
    const agentId = String(agent.id ?? "").trim();
    const runId = String(run?.id ?? agent.latestRunId ?? "").trim();
    if (!agentId || !runId) {
      throw new Error("Cursor agent create returned no ids");
    }

    const deadline = Date.now() + 70_000;
    while (Date.now() < deadline) {
      const row = await this.requestJson("GET", `/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`, args.apiKey);
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
