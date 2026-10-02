/**
 * Assistant API (task rules #36, #71, #58): guest-friendly chat with
 * optional auth, SSE streaming, per-route throttle stricter than the
 * global one, feedback, conversation history, and the admin analytics
 * overview (ADMIN/SUPER_ADMIN only).
 */

import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AssistantService } from "./assistant.service";
import { ConversationService } from "./conversation/conversation.service";
import { AiUsageService } from "./observability/ai-usage.service";
import { AssistantMemoryService } from "./memory/memory.service";
import { LessonsService } from "./learning/lessons.service";
import { WelcomeService } from "./welcome/welcome.service";
import { ChatRequestDto, FeedbackRequestDto } from "./dto/assistant.dto";
import { OptionalJwtAuthGuard } from "./optional-jwt.guard";

interface RequestUser {
  id: string;
  role: Role;
}

@ApiTags("assistant")
@Controller("assistant")
@UseGuards(OptionalJwtAuthGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly conversations: ConversationService,
    private readonly usage: AiUsageService,
    private readonly memory: AssistantMemoryService,
    private readonly lessons: LessonsService,
    private readonly welcome: WelcomeService,
  ) {}

  /** Personalized opener for the chat screen (deterministic, no LLM). */
  @Get("welcome")
  async assistantWelcome(@Req() req: FastifyRequest & { user?: RequestUser }, @Query("guestKey") guestKey?: string) {
    return this.welcome.build({ userId: req.user?.id ?? null, guestKey: guestKey ?? null });
  }

  @Post("chat")
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async chat(@Req() req: FastifyRequest & { user?: RequestUser }, @Body() dto: ChatRequestDto) {
    return this.assistant.handleTurn({
      message: dto.message,
      conversationId: dto.conversationId,
      userId: req.user?.id ?? null,
      guestKey: dto.guestKey,
      screen: dto.screen,
      cart: dto.cart,
      debug: this.canDebug(req.user),
    });
  }

  @Post("chat/stream")
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async chatStream(
    @Req() req: FastifyRequest & { user?: RequestUser },
    @Body() dto: ChatRequestDto,
    @Res() reply: FastifyReply,
  ) {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "identity",
    });
    reply.raw.write(`retry: 2000\n\n`);

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const response = await this.assistant.handleTurn(
        {
          message: dto.message,
          conversationId: dto.conversationId,
          userId: req.user?.id ?? null,
          guestKey: dto.guestKey,
          screen: dto.screen,
          cart: dto.cart,
          debug: this.canDebug(req.user),
        },
        {
          onDelta: (text) => send("delta", { text }),
          onStatus: (label) => send("status", { label }),
        },
      );
      send("final", response);
    } catch (err) {
      send("error", { message: "تعذر إكمال الطلب — جرّب مرة ثانية." });
      void err;
    } finally {
      reply.raw.end();
    }
  }

  @Get("conversations")
  async myConversations(@Req() req: FastifyRequest & { user?: RequestUser }) {
    if (!req.user) throw new UnauthorizedException("سجّل الدخول لعرض محادثاتك");
    return { items: await this.conversations.listForOwner({ userId: req.user.id }) };
  }

  @Get("conversations/:id/messages")
  async conversationMessages(@Req() req: FastifyRequest & { user?: RequestUser }, @Param("id") id: string, @Query("guestKey") guestKey?: string) {
    const owner = { userId: req.user?.id ?? null, guestKey: guestKey ?? null };
    const conversation = await this.conversations.getOwnedForRead(id, owner);
    if (!conversation) throw new UnauthorizedException("لا تملك صلاحية لهذه المحادثة");
    return { items: await this.conversations.recentMessages(id, 200) };
  }

  @Post("messages/:id/feedback")
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  async feedback(
    @Req() req: FastifyRequest & { user?: RequestUser },
    @Param("id") messageId: string,
    @Body() dto: FeedbackRequestDto,
    @Query("guestKey") guestKey?: string,
  ) {
    const ok = await this.conversations.setFeedback(messageId, dto.value === 1 ? 1 : -1, dto.note, {
      userId: req.user?.id ?? null,
      guestKey: guestKey ?? null,
    });
    return { saved: ok };
  }

  @Post("memory/clear")
  async clearMyMemory(@Req() req: FastifyRequest & { user?: RequestUser }, @Query("guestKey") guestKey?: string) {
    const owner = { userId: req.user?.id ?? null, guestKey: guestKey ?? null };
    if (!owner.userId && !owner.guestKey) throw new UnauthorizedException("مفتاح الزائر مطلوب لمسح الذاكرة");
    const removed = await this.memory.clear(owner);
    return { removed };
  }

  @Get("memory")
  async myMemory(@Req() req: FastifyRequest & { user?: RequestUser }, @Query("guestKey") guestKey?: string) {
    const owner = { userId: req.user?.id ?? null, guestKey: guestKey ?? null };
    const facts = await this.memory.load(owner);
    return { items: facts };
  }

  @Get("admin/overview")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminOverview(@Query("days") days?: string) {
    const parsed = Number(days);
    return this.usage.overview(Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 365) : 30);
  }

  @Get("admin/lessons")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminLessons(@Query("activeOnly") activeOnly?: string) {
    return { items: await this.lessons.list(activeOnly === "1" ? false : true) };
  }

  @Post("admin/lessons/mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminMineLessons(@Query("days") days?: string) {
    const parsed = Number(days);
    return this.lessons.mineFromFeedback(Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 365) : 30);
  }

  @Post("admin/lessons")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminAddLesson(@Body() body: { content?: string }) {
    const content = (body.content ?? "").trim();
    if (content.length < 8) throw new UnauthorizedException("الدرس قصير جداً");
    await this.lessons.addManualLesson(content);
    return { saved: true };
  }

  @Patch("admin/lessons/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminToggleLesson(@Param("id") id: string, @Body() body: { isActive?: boolean }) {
    const ok = await this.lessons.setActive(id, body.isActive !== false);
    if (!ok) throw new UnauthorizedException("الدرس غير موجود");
    return { saved: true };
  }

  @Get("admin/conversations")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminConversations(
    @Query("take") take?: string,
    @Query("intent") intent?: string,
    @Query("feedback") feedback?: string,
    @Query("days") days?: string,
  ) {
    const parsedTake = Number(take);
    const parsedDays = Number(days);
    return {
      items: await this.conversations.listForAdmin({
        take: Number.isFinite(parsedTake) ? Math.min(Math.max(parsedTake, 1), 50) : 30,
        intent: intent || undefined,
        feedback: feedback === "-1" || feedback === "1" ? Number(feedback) : undefined,
        days: Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 365) : 30,
      }),
    };
  }

  @Get("admin/conversations/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  async adminConversation(@Param("id") id: string) {
    return this.conversations.adminConversationDetail(id);
  }

  /** Debug traces are admin-only regardless of what the client sends. */
  private canDebug(user?: RequestUser): boolean {
    return Boolean(user && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN));
  }
}
