/**
 * Conversation persistence: AiConversation + AiMessage rows, recent-window
 * loading, daily message caps, and feedback (task rules #16, #57, #71, #76).
 */

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma.service";
import type { AssistantResponse, AssistantIntent } from "../assistant.types";

const RECENT_WINDOW = 14;

export interface ConversationOwner {
  userId?: string | null;
  guestKey?: string | null;
}

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Loads (ownership-checked) or creates a conversation. */
  async getOrCreate(conversationId: string | undefined, owner: ConversationOwner) {
    if (conversationId) {
      const existing = await this.prisma.aiConversation.findUnique({ where: { id: conversationId } });
      if (existing && this.owns(existing.userId, existing.guestKey, owner)) return existing;
    }
    return this.prisma.aiConversation.create({
      data: {
        userId: owner.userId ?? null,
        guestKey: owner.guestKey ?? null,
        state: {},
      },
    });
  }

  /** Load a conversation only when the caller owns it (history endpoint). */
  async getOwnedForRead(id: string, owner: ConversationOwner) {
    const row = await this.prisma.aiConversation.findUnique({ where: { id } });
    if (!row || !this.owns(row.userId, row.guestKey, owner)) return null;
    return row;
  }

  async listForOwner(owner: ConversationOwner, take = 30) {
    return this.prisma.aiConversation.findMany({
      where: {
        ...(owner.userId ? { userId: owner.userId } : {}),
        ...(owner.guestKey ? { guestKey: owner.guestKey } : {}),
      },
      orderBy: { lastMessageAt: "desc" },
      take,
      select: { id: true, title: true, lastIntent: true, messageCount: true, lastMessageAt: true },
    });
  }

  async loadState(conversationId: string): Promise<{ state: Record<string, unknown>; summary: string | null; messageCount: number }> {
    const conversation = await this.prisma.aiConversation.findUnique({ where: { id: conversationId } });
    return {
      state: (conversation?.state as Record<string, unknown>) ?? {},
      summary: conversation?.summary ?? null,
      messageCount: conversation?.messageCount ?? 0,
    };
  }

  async saveState(conversationId: string, state: Record<string, unknown>, intent?: AssistantIntent | string, title?: string) {
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: {
        state: state as unknown as import("@prisma/client").Prisma.InputJsonValue,
        ...(intent ? { lastIntent: String(intent) } : {}),
        ...(title ? { title: title.slice(0, 80) } : {}),
        lastMessageAt: new Date(),
      },
    });
  }

  async recentMessages(conversationId: string, limit = RECENT_WINDOW) {
    const rows = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { role: true, content: true, payload: true, createdAt: true },
    });
    return rows.reverse();
  }

  async appendUserMessage(conversationId: string, content: string) {
    const [message] = await this.prisma.$transaction([
      this.prisma.aiMessage.create({ data: { conversationId, role: "USER", content } }),
      this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
      }),
    ]);
    return message;
  }

  async appendAssistantMessage(
    conversationId: string,
    response: AssistantResponse,
    meta: { intent?: string; model?: string; promptVersion?: string; latencyMs?: number; tokensIn?: number; tokensOut?: number },
  ) {
    const [message] = await this.prisma.$transaction([
      this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          content: response.message,
          payload: response as unknown as import("@prisma/client").Prisma.InputJsonValue,
          intent: meta.intent,
          model: meta.model,
          promptVersion: meta.promptVersion,
          latencyMs: meta.latencyMs,
          tokensIn: meta.tokensIn,
          tokensOut: meta.tokensOut,
        },
      }),
      this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
      }),
    ]);
    return message;
  }

  /** True when the sender hit their daily message cap (rule #71/#72). */
  async isOverDailyCap(owner: ConversationOwner, cap: number): Promise<boolean> {
    if (!cap || cap <= 0) return false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.aiMessage.count({
      where: {
        role: "USER",
        createdAt: { gte: since },
        conversation: {
          ...(owner.userId ? { userId: owner.userId } : {}),
          ...(owner.guestKey ? { guestKey: owner.guestKey } : {}),
        },
      },
    });
    return count >= cap;
  }

  async setFeedback(messageId: string, value: 1 | -1, note?: string, owner?: ConversationOwner): Promise<boolean> {
    const message = await this.prisma.aiMessage.findUnique({
      where: { id: messageId },
      include: { conversation: { select: { userId: true, guestKey: true } } },
    });
    if (!message) return false;
    if (owner && !this.owns(message.conversation.userId, message.conversation.guestKey, owner)) return false;
    await this.prisma.aiMessage.update({
      where: { id: messageId },
      data: { feedback: value, feedbackNote: note?.slice(0, 300) },
    });
    return true;
  }

  async saveSummary(conversationId: string, summary: string) {
    await this.prisma.aiConversation.update({ where: { id: conversationId }, data: { summary } });
  }

  /** Set the conversation title without touching state (history list label). */
  async saveTitle(conversationId: string, title: string) {
    await this.prisma.aiConversation.update({ where: { id: conversationId }, data: { title: title.slice(0, 80) } });
  }

  /** Admin QA listing: recent conversations with feedback tallies. */
  async listForAdmin(filter: { take: number; intent?: string; feedback?: number; days: number }) {
    const since = new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.aiConversation.findMany({
      where: {
        lastMessageAt: { gte: since },
        ...(filter.intent ? { lastIntent: filter.intent } : {}),
        ...(filter.feedback ? { messages: { some: { feedback: filter.feedback } } } : {}),
      },
      orderBy: { lastMessageAt: "desc" },
      take: filter.take,
      select: {
        id: true,
        title: true,
        lastIntent: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true, phone: true } },
        messages: { where: { feedback: { not: null } }, select: { feedback: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      lastIntent: row.lastIntent,
      messageCount: row.messageCount,
      lastMessageAt: row.lastMessageAt,
      createdAt: row.createdAt,
      userId: row.userId,
      userName: row.user?.name ?? null,
      userPhone: row.user?.phone ?? null,
      feedbackUp: row.messages.filter((m) => m.feedback === 1).length,
      feedbackDown: row.messages.filter((m) => m.feedback === -1).length,
    }));
  }

  /** Admin QA viewer: full transcript with structured payloads + feedback. */
  async adminConversationDetail(id: string) {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        lastIntent: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true, phone: true } },
      },
    });
    if (!conversation) return null;
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        role: true,
        content: true,
        payload: true,
        intent: true,
        latencyMs: true,
        tokensIn: true,
        tokensOut: true,
        feedback: true,
        feedbackNote: true,
        createdAt: true,
      },
    });
    return {
      conversation: {
        ...conversation,
        userName: conversation.user?.name ?? null,
        userPhone: conversation.user?.phone ?? null,
        user: undefined,
      },
      messages,
    };
  }

  private owns(rowUserId: string | null, rowGuestKey: string | null, owner: ConversationOwner): boolean {
    if (rowUserId && owner.userId) return rowUserId === owner.userId;
    if (rowGuestKey && owner.guestKey) return rowGuestKey === owner.guestKey;
    // Legacy rows without owner keys stay private.
    return !rowUserId && !rowGuestKey;
  }
}
