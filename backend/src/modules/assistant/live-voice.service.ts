import { HttpAdapterHost } from "@nestjs/core";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import { PrismaService } from "../../common/prisma.service";
import { AssistantService } from "./assistant.service";

type LiveSocket = WebSocket & { userId?: string };

@Injectable()
export class LiveVoiceService implements OnModuleInit {
  private readonly logger = new Logger(LiveVoiceService.name);

  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly assistant: AssistantService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const fastify = this.adapter?.httpAdapter?.getInstance?.() as any;
    if (!fastify) return;
    fastify.get("/api/v1/assistant/live", { websocket: true }, (socket: LiveSocket, request: { headers: Record<string, string | undefined>; query?: { token?: string } }) => {
      void this.handle(socket, request);
    });
  }

  private async handle(client: LiveSocket, request: { headers: Record<string, string | undefined>; query?: { token?: string } }) {
    const userId = await this.userIdFrom(request);
    if (!userId) {
      this.send(client, { type: "error", message: "سجّلي الدخول حتى نفتح المحادثة الصوتية." });
      client.close();
      return;
    }
    const apiKey = process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      this.send(client, { type: "error", message: "الصوت المباشر غير جاهز حالياً." });
      client.close();
      return;
    }

    const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
    const upstream = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    let ready = false;
    let assistantText = "";
    let userText = "";
    let products: unknown[] = [];
    const handledCalls = new Set<string>();

    const closeBoth = () => {
      if (upstream.readyState === WebSocket.OPEN) upstream.close();
      if (client.readyState === WebSocket.OPEN) client.close();
    };

    upstream.on("open", () => {
      upstream.send(JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          instructions: [
            "أنتِ فضه، بنت من بغداد، تحجين ويا زبونة على الهاتف.",
            "اللهجة بغدادية نسائية طبيعية، جمل قصيرة، مو فصحى ومو مصرية ومو خليجية.",
            "تسمعينها وأنتِ تحجين. إذا قاطعتج، اسكتي فوراً واسمعي.",
            "قبل ما تذكرين أي منتج أو سعر أو طريقة استخدام، استدعي search_store. البطاقات تظهر قدامها على الشاشة، فاحكي عن اللي رجع فقط.",
            "إذا رجع sayExactly، اقرئيه كما هو بدون زيادة.",
            "إذا رجع note وفيه منتجات، احكي بس عنهن وبأسعارهن المكتوبة.",
            "ممنوع اختراع منتج أو سعر. إذا ما لقيتِ، قولي ذلك.",
          ].join(" "),
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: { model: "gpt-4o-mini-transcribe", language: "ar" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 280,
                silence_duration_ms: 450,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              format: { type: "audio/pcm", rate: 24000 },
              voice: "marin",
            },
          },
          tools: [
            {
              type: "function",
              name: "search_store",
              description: "Search the real Deema store. Call before mentioning any product, price, or usage.",
              parameters: {
                type: "object",
                properties: {
                  request: { type: "string", description: "What the shopper just asked, in her words." },
                },
                required: ["request"],
              },
            },
          ],
          tool_choice: "auto",
        },
      }));
    });

    upstream.on("message", (raw) => {
      let event: Record<string, any>;
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const type = String(event.type ?? "");
      if (type === "session.updated") {
        ready = true;
        this.send(client, { type: "ready" });
        return;
      }
      if (type === "error") {
        this.logger.warn(`realtime error: ${JSON.stringify(event.error ?? event).slice(0, 300)}`);
        if (!ready) this.send(client, { type: "error", message: "ما قدرت أفتح الصوت المباشر." });
        return;
      }
      if (type === "input_audio_buffer.speech_started") {
        assistantText = "";
        this.send(client, { type: "clear" });
        this.send(client, { type: "status", phase: "listening" });
        return;
      }
      if (type === "input_audio_buffer.speech_stopped") {
        this.send(client, { type: "status", phase: "thinking" });
        return;
      }
      if (type === "response.output_audio.delta" || type === "response.audio.delta") {
        const audio = String(event.delta ?? "");
        if (audio) {
          this.send(client, { type: "status", phase: "speaking" });
          this.send(client, { type: "audio", audio });
        }
        return;
      }
      if (type === "response.output_audio_transcript.delta" || type === "response.audio_transcript.delta") {
        assistantText += String(event.delta ?? "");
        this.send(client, { type: "caption", role: "assistant", text: assistantText });
        return;
      }
      if (type === "conversation.item.input_audio_transcription.completed") {
        userText = String(event.transcript ?? "").trim();
        if (userText) this.send(client, { type: "caption", role: "user", text: userText });
        return;
      }
      if (type === "response.function_call_arguments.done" || this.isFunctionItem(event)) {
        void this.runTool(upstream, client, userId, event, handledCalls, userText, (next) => {
          products = next;
        });
        return;
      }
      if (type === "response.done") {
        if (assistantText.trim() || products.length) {
          this.send(client, { type: "turn", userText, text: assistantText.trim(), products });
          assistantText = "";
          userText = "";
          products = [];
        }
        this.send(client, { type: "status", phase: "listening" });
      }
    });

    upstream.on("error", (error) => {
      this.logger.warn(`realtime socket: ${error.message}`);
      this.send(client, { type: "error", message: "انقطع الصوت المباشر." });
    });
    upstream.on("close", () => {
      if (client.readyState === WebSocket.OPEN) client.close();
    });

    client.on("message", (raw, isBinary) => {
      if (!ready || upstream.readyState !== WebSocket.OPEN) return;
      const audio = isBinary ? Buffer.from(raw as Buffer).toString("base64") : this.audioFromJson(raw.toString());
      if (!audio) return;
      upstream.send(JSON.stringify({ type: "input_audio_buffer.append", audio }));
    });
    client.on("close", closeBoth);
    client.on("error", closeBoth);
  }

  private isFunctionItem(event: Record<string, any>) {
    return event.type === "response.output_item.done" && event.item?.type === "function_call";
  }

  private async runTool(
    upstream: WebSocket,
    client: LiveSocket,
    userId: string,
    event: Record<string, any>,
    handled: Set<string>,
    userText: string,
    setProducts: (products: unknown[]) => void,
  ) {
    const item = event.item ?? event;
    const callId = String(item.call_id ?? event.call_id ?? "");
    if (!callId || handled.has(callId)) return;
    handled.add(callId);
    let request = userText;
    try {
      const parsed = JSON.parse(String(item.arguments ?? event.arguments ?? "{}")) as { request?: string };
      if (parsed.request?.trim()) request = parsed.request.trim();
    } catch {
      /* نستخدم آخر جملة سمعتها. */
    }
    let result: { found: boolean; sayExactly: string; products: unknown[]; note: string };
    try {
      result = await this.assistant.voiceLookup(userId, request || userText);
    } catch (error) {
      this.logger.warn(`voice lookup failed: ${error instanceof Error ? error.message : error}`);
      result = { found: false, sayExactly: "صار خلل وأنا أدور. عيدي الطلب.", products: [], note: "" };
    }
    setProducts(result.products);
    this.send(client, {
      type: "products",
      products: result.products,
      reply: result.sayExactly,
      userText: request || userText,
    });
    if (upstream.readyState !== WebSocket.OPEN) return;
    upstream.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify({ found: result.found, sayExactly: result.sayExactly, note: result.note }),
      },
    }));
    upstream.send(JSON.stringify({ type: "response.create" }));
  }

  private audioFromJson(raw: string) {
    try {
      const body = JSON.parse(raw) as { type?: string; audio?: string };
      if (body.type === "audio" && body.audio) return body.audio;
    } catch {
      return "";
    }
    return "";
  }

  private async userIdFrom(request: { headers: Record<string, string | undefined>; query?: { token?: string } }) {
    const header = request.headers.authorization ?? request.headers.Authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : request.query?.token;
    if (!token) return "";
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET ?? "access") as { sub?: string };
      if (!payload.sub) return "";
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true, deletedAt: true },
      });
      if (!user || !user.isActive || user.deletedAt) return "";
      return user.id;
    } catch {
      return "";
    }
  }

  private send(client: WebSocket, payload: Record<string, unknown>) {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
  }
}
