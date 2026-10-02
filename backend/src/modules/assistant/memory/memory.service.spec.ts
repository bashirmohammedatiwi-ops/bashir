import { describe, expect, it, vi } from "vitest";
import { AssistantMemoryService } from "./memory.service";
import type { MemoryFact } from "../assistant.types";

function makeService(prisma: { aiUserMemory: unknown; brand?: unknown }) {
  return new AssistantMemoryService(prisma as never);
}

describe("AssistantMemoryService.load", () => {
  it("returns [] when the visitor has no stable identity", async () => {
    const service = makeService({ aiUserMemory: {} });
    expect(await service.load({})).toEqual([]);
  });

  it("maps rows to facts as stored (DB sorts by evidence)", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { kind: "brand_like", key: "brand:b1", value: "Garnier", evidence: 5 },
      { kind: "preference", key: "skinType", value: "دهنية", evidence: 3 },
    ]);
    const service = makeService({ aiUserMemory: { findMany } });
    const facts = await service.load({ userId: "u1" });
    expect(findMany).toHaveBeenCalled();
    expect(facts).toEqual([
      { kind: "brand_like", key: "brand:b1", value: "Garnier", evidence: 5 },
      { kind: "preference", key: "skinType", value: "دهنية", evidence: 3 },
    ]);
  });

  it("swallows storage failures", async () => {
    const findMany = vi.fn().mockRejectedValue(new Error("db down"));
    const service = makeService({ aiUserMemory: { findMany } });
    expect(await service.load({ userId: "u1" })).toEqual([]);
  });
});

describe("AssistantMemoryService.remember", () => {
  it("increments evidence for the same key/value", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "m1", value: "دهنية" });
    const update = vi.fn().mockResolvedValue({});
    const service = makeService({ aiUserMemory: { findUnique, update, create: vi.fn() } });
    await service.remember({ userId: "u1" }, [{ kind: "preference", key: "skinType", value: "دهنية", evidence: 1 }]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1" }, data: expect.objectContaining({ evidence: { increment: 1 } }) }),
    );
  });

  it("replaces the value when the user changed their mind", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "m1", value: "قديم" });
    const update = vi.fn().mockResolvedValue({});
    const service = makeService({ aiUserMemory: { findUnique, update, create: vi.fn() } });
    await service.remember({ userId: "u1" }, [{ kind: "preference", key: "skinType", value: "جديدة", evidence: 1 }]);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1" }, data: expect.objectContaining({ value: "جديدة", evidence: 1 }) }),
    );
  });

  it("creates a new row keyed by guest ownerKey", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({});
    const service = makeService({ aiUserMemory: { findUnique, update: vi.fn(), create } });
    await service.remember({ guestKey: "device-1" }, [{ kind: "budget", key: "typical_max", value: "50000", evidence: 1 }]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerKey: "guest:device-1", kind: "budget", value: "50000" }) }),
    );
  });
});

describe("AssistantMemoryService.extractFromState", () => {
  it("promotes repeated preferences and resolves brand names", async () => {
    const brandFindMany = vi.fn().mockResolvedValue([{ id: "b1", name: "Garnier" }, { id: "b2", name: "Nivea" }]);
    const service = makeService({ aiUserMemory: {}, brand: { findMany: brandFindMany } });
    const remember = vi.spyOn(service, "remember").mockResolvedValue(undefined);

    await service.extractFromState(
      { userId: "u1" },
      {
        preferences: [
          { key: "skinType", value: "دهنية", hard: false },
          { key: "style", value: "حلو", hard: false }, // noise key — dropped
        ],
        preferenceEvidence: { "skinType:دهنية": 2, "style:حلو": 3 },
        preferredBrandIds: ["b1"],
        excludedBrandIds: ["b2"],
        budget: { max: 60_000, scope: "per_item" },
      },
    );

    const facts = remember.mock.calls[0][1] as MemoryFact[];
    expect(facts).toContainEqual(expect.objectContaining({ kind: "preference", key: "skinType", value: "دهنية" }));
    expect(facts).toContainEqual(expect.objectContaining({ kind: "brand_like", value: "Garnier" }));
    expect(facts).toContainEqual(expect.objectContaining({ kind: "brand_dislike", value: "Nivea" }));
    expect(facts).toContainEqual(expect.objectContaining({ kind: "budget", value: "60000" }));
    expect(facts.find((f) => f.key === "style")).toBeUndefined();
  });

  it("skips tiny budgets and stores nothing", async () => {
    const service = makeService({ aiUserMemory: {} });
    const remember = vi.spyOn(service, "remember").mockResolvedValue(undefined);
    await service.extractFromState({ userId: "u1" }, { budget: { max: 500, scope: "per_item" } });
    expect(remember).toHaveBeenCalledWith({ userId: "u1" }, []);
  });
});

describe("AssistantMemoryService.describe", () => {
  it("renders Arabic memory lines", () => {
    const service = makeService({ aiUserMemory: {} });
    const text = service.describe([
      { kind: "brand_like", key: "brand:b1", value: "Garnier", evidence: 3 },
      { kind: "budget", key: "typical_max", value: "50000", evidence: 2 },
      { kind: "preference", key: "skinType", value: "دهنية", evidence: 2 },
    ]);
    expect(text).toContain("يفضّل براند: Garnier");
    expect(text).toContain("50,000 د.ع");
    expect(text).toContain("skinType: دهنية");
  });

  it("returns empty for no memory", () => {
    const service = makeService({ aiUserMemory: {} });
    expect(service.describe([])).toBe("");
  });
});
