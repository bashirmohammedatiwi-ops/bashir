import { describe, expect, it, vi } from "vitest";
import { LessonsService } from "./lessons.service";
import { WelcomeService } from "../welcome/welcome.service";
import { AssistantMemoryService } from "../memory/memory.service";

function fakeProvider(text: string) {
  return {
    name: "mock",
    chat: vi.fn().mockResolvedValue({ text, toolCalls: [], usage: { inputTokens: 1, outputTokens: 1 }, model: "m", finishReason: "stop" }),
    embed: vi.fn(),
  };
}

function lessonsService(prisma: unknown, reply: string) {
  return new LessonsService(prisma as never, fakeProvider(reply) as never, { fastModel: "mini" });
}

describe("LessonsService", () => {
  it("returns active lesson contents ordered by evidence", async () => {
    const svc = lessonsService(
      {
        aiLesson: {
          findMany: vi.fn().mockResolvedValue([
            { content: "اذكر العملة مع كل سعر" },
            { content: "لا تقترح أكثر من 5 منتجات" },
          ]),
        },
      },
      "",
    );
    expect(await svc.activeLessons()).toEqual(["اذكر العملة مع كل سعر", "لا تقترح أكثر من 5 منتجات"]);
  });

  it("renders a numbered lessons block", async () => {
    const svc = lessonsService(
      {
        aiLesson: { findMany: vi.fn().mockResolvedValue([{ content: "درس واحد" }]) },
      },
      "",
    );
    expect(await svc.lessonsBlock()).toBe("1. درس واحد");
  });

  it("mines lessons from 👎 feedback and upserts them", async () => {
    const create = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const svc = lessonsService(
      {
        aiMessage: {
          findMany: vi.fn().mockResolvedValue([
            { id: "m1", content: "رد سيء بدون سعر", conversationId: "c1", feedbackNote: "ما ذكرت السعر" },
          ]),
          findFirst: vi.fn().mockResolvedValue({ content: "شو أفضل عطر؟" }),
        },
        aiLesson: {
          findMany: vi.fn().mockResolvedValue([]), // active lessons empty
          findFirst: vi.fn(),
          create,
          update,
        },
      },
      "اذكر العملة د.ع مع كل سعر\nلا تكرر نفس المنتج بأحجام مختلفة",
    );

    const result = await svc.mineFromFeedback(30);
    expect(result.scanned).toBe(1);
    expect(result.learned).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ content: "اذكر العملة د.ع مع كل سعر" }) }));
  });

  it("increments evidence when the same lesson recurs (paraphrase key)", async () => {
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn();
    const svc = lessonsService(
      {
        aiMessage: {
          findMany: vi.fn().mockResolvedValue([{ id: "m1", content: "رد سيء", conversationId: "c1", feedbackNote: null }]),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        aiLesson: {
          findMany: vi.fn().mockResolvedValue([{ id: "l1", content: "اذكر العملة د.ع مع كل سعر" }]),
          findFirst: vi.fn(),
          create,
          update,
        },
      },
      "اذكر العملة د.ع مع كل سعر",
    );
    await svc.mineFromFeedback(30);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "l1" }, data: { evidence: { increment: 1 }, updatedAt: expect.any(Date) } }));
    expect(create).not.toHaveBeenCalled();
  });

  it("returns zero learned when no negative feedback exists", async () => {
    const svc = lessonsService(
      {
        aiMessage: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
        aiLesson: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      },
      "",
    );
    expect(await svc.mineFromFeedback(30)).toEqual({ scanned: 0, learned: 0 });
  });
});

describe("WelcomeService", () => {
  const realMemory = new AssistantMemoryService({} as never);

  function welcomeService(memoryFacts: unknown[], offersCount: number) {
    const prisma = { product: { count: vi.fn().mockResolvedValue(offersCount) } };
    const memory = { load: vi.fn().mockResolvedValue(memoryFacts), groupedSummary: realMemory.groupedSummary.bind(realMemory) };
    const svc = new WelcomeService(prisma as never, memory as unknown as AssistantMemoryService);
    return { svc, memory };
  }

  it("greets personally using liked brands from memory", async () => {
    const { svc } = welcomeService(
      [
        { kind: "brand_like", key: "brand:b1", value: "غارنييه", evidence: 3 },
        { kind: "preference", key: "skinType", value: "دهنية", evidence: 2 },
      ],
      5,
    );
    const payload = await svc.build({ userId: "u1" });
    expect(payload.greeting).toContain("غارنييه");
    expect(payload.greeting).toContain("دهنية");
    expect(payload.chips.some((c) => c.label.includes("غارنييه"))).toBe(true);
    expect(payload.memorySummary).toBeTruthy();
  });

  it("falls back to offers-based greeting without memory", async () => {
    const { svc } = welcomeService([], 12);
    const payload = await svc.build({ guestKey: "g1" });
    expect(payload.greeting).toContain("12");
    expect(payload.chips.some((c) => c.action.includes("العروض"))).toBe(true);
    expect(payload.memorySummary).toBeNull();
  });

  it("generic greeting when no memory and no offers", async () => {
    const { svc } = welcomeService([], 0);
    const payload = await svc.build({});
    expect(payload.greeting.length).toBeGreaterThan(5);
    expect(payload.chips.length).toBeGreaterThan(0);
  });
});
