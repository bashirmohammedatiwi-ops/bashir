import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { barcodeLookupCandidates, normalizeBarcode } from "../../common/barcode.util";
import { PrismaService } from "../../common/prisma.service";
import { InventorySyncService } from "../sync/inventory-sync.service";
import { controlMediaUrls } from "./control-media.util";
import { ControlService } from "./control.service";
import { DraftDto, DraftGroupDto, DraftsQueryDto } from "./dto/control.dto";

const GROUP_COLORS = ["violet", "rose", "gold", "mint", "sky", "coral", "slate"];

type DraftRow = Prisma.BarcodeDraftGetPayload<{ include: { group: { select: { id: true; name: true; color: true } } } }>;

@Injectable()
export class BarcodeDraftsService {
  /** آخر فحص «هل أضيف؟» — لا نكرره لكل طلب متتالٍ. */
  private resolvedAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventorySyncService,
    private readonly control: ControlService,
  ) {}

  // ------------------------------------------------------------ groups

  async groups(includeArchived = false) {
    await this.resolveAdded();
    const groups = await this.prisma.barcodeDraftGroup.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ isArchived: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    });
    if (!groups.length) return [];
    const counts = await this.prisma.barcodeDraft.groupBy({
      by: ["groupId"],
      where: { groupId: { in: groups.map((g) => g.id) } },
      _count: { _all: true, addedAt: true },
      _max: { createdAt: true },
    });
    const byGroup = new Map(counts.map((c) => [c.groupId, c]));
    const covers = await this.prisma.barcodeDraft.findMany({
      where: { groupId: { in: groups.map((g) => g.id) }, imageIds: { isEmpty: false } },
      orderBy: { createdAt: "desc" },
      select: { groupId: true, imageIds: true },
      take: groups.length * 4,
    });
    const coverIds = [...new Set(covers.map((c) => c.imageIds[0]).filter(Boolean))];
    const media = await this.mediaMap(coverIds);
    return groups.map((g) => {
      const c = byGroup.get(g.id);
      const total = c?._count._all ?? 0;
      const added = c?._count.addedAt ?? 0;
      return {
        id: g.id,
        name: g.name,
        color: g.color,
        note: g.note,
        position: g.position,
        isArchived: g.isArchived,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        lastDraftAt: c?._max.createdAt ?? null,
        total,
        added,
        pending: total - added,
        covers: covers
          .filter((cv) => cv.groupId === g.id)
          .slice(0, 3)
          .map((cv) => media.get(cv.imageIds[0])?.thumb)
          .filter(Boolean),
      };
    });
  }

  async createGroup(dto: DraftGroupDto, actorId?: string) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException("اكتب اسم المجموعة");
    const count = await this.prisma.barcodeDraftGroup.count();
    const group = await this.prisma.barcodeDraftGroup.create({
      data: {
        name,
        color: dto.color ?? GROUP_COLORS[count % GROUP_COLORS.length],
        note: dto.note?.trim() || null,
        position: dto.position ?? count,
        createdById: actorId ?? null,
      },
    });
    return { ...group, total: 0, added: 0, pending: 0, covers: [], lastDraftAt: null };
  }

  async updateGroup(id: string, dto: DraftGroupDto) {
    await this.ensureGroup(id);
    if (dto.name !== undefined && !dto.name.trim()) throw new BadRequestException("اسم المجموعة فارغ");
    await this.prisma.barcodeDraftGroup.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        color: dto.color,
        note: dto.note !== undefined ? dto.note.trim() || null : undefined,
        isArchived: dto.isArchived,
        position: dto.position,
      },
    });
    return (await this.groups(true)).find((g) => g.id === id);
  }

  async deleteGroup(id: string) {
    await this.ensureGroup(id);
    const res = await this.prisma.barcodeDraft.count({ where: { groupId: id } });
    await this.prisma.barcodeDraftGroup.delete({ where: { id } });
    return { success: true, deletedDrafts: res };
  }

  async reorderGroups(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.barcodeDraftGroup.update({ where: { id }, data: { position } })),
    );
    return this.groups();
  }

  // ------------------------------------------------------------ drafts

  async list(q: DraftsQueryDto) {
    await this.resolveAdded();
    const where: Prisma.BarcodeDraftWhereInput = {
      groupId: q.groupId || undefined,
      addedAt: q.status === "pending" ? null : q.status === "added" ? { not: null } : undefined,
      ...(q.groupId ? {} : { group: { isArchived: false } }),
    };
    const text = q.q?.trim();
    if (text) {
      where.OR = [
        { barcode: { contains: normalizeBarcode(text) || text, mode: "insensitive" } },
        { name: { contains: text, mode: "insensitive" } },
        { note: { contains: text, mode: "insensitive" } },
      ];
    }
    const limit = q.limit ?? 60;
    const page = q.page ?? 1;
    const [total, rows] = await Promise.all([
      this.prisma.barcodeDraft.count({ where }),
      this.prisma.barcodeDraft.findMany({
        where,
        // غير المضاف أولاً، ثم الأحدث
        orderBy: [{ addedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { group: { select: { id: true, name: true, color: true } } },
      }),
    ]);
    const items = await this.format(rows);
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page * limit < total },
    };
  }

  async one(id: string) {
    const row = await this.prisma.barcodeDraft.findUnique({
      where: { id },
      include: { group: { select: { id: true, name: true, color: true } } },
    });
    if (!row) throw new NotFoundException("المسودة غير موجودة");
    return (await this.format([row]))[0];
  }

  /** حفظ باركود غير موجود. نفس الباركود في نفس المجموعة يُحدَّث بدل التكرار. */
  async create(dto: DraftDto, actorId?: string) {
    const barcode = normalizeBarcode(dto.barcode);
    if (!barcode) throw new BadRequestException("الباركود مطلوب");
    if (!dto.groupId) throw new BadRequestException("اختر المجموعة");
    await this.ensureGroup(dto.groupId);

    const inApp = await this.findInApp(barcode);
    if (inApp) {
      throw new ConflictException({
        message: `المنتج موجود في التطبيق: ${inApp.name}`,
        productId: inApp.productId,
      });
    }

    const imageIds = await this.validMediaIds(dto.imageIds ?? []);
    const existing = await this.prisma.barcodeDraft.findFirst({
      where: { groupId: dto.groupId, barcode: { in: barcodeLookupCandidates(barcode) } },
    });
    let id: string;
    if (existing) {
      const merged = [...new Set([...existing.imageIds, ...imageIds])].slice(0, 12);
      await this.prisma.barcodeDraft.update({
        where: { id: existing.id },
        data: {
          name: dto.name?.trim() || existing.name,
          note: dto.note?.trim() || existing.note,
          quantity: dto.quantity ?? existing.quantity,
          imageIds: merged,
        },
      });
      id = existing.id;
    } else {
      let name = dto.name?.trim() || null;
      if (!name) {
        const pos = await this.inventory.getSnapshotForBarcodes([barcode]).catch(() => null);
        name = pos?.name?.trim() || null;
      }
      const row = await this.prisma.barcodeDraft.create({
        data: {
          groupId: dto.groupId,
          barcode,
          name,
          note: dto.note?.trim() || null,
          quantity: dto.quantity ?? null,
          imageIds,
          createdById: actorId ?? null,
        },
      });
      id = row.id;
    }
    await this.prisma.barcodeDraftGroup.update({ where: { id: dto.groupId }, data: { updatedAt: new Date() } });
    await this.control.audit(actorId, "draft.save", "BarcodeDraft", id, { barcode, groupId: dto.groupId });
    return { ...(await this.one(id)), merged: !!existing };
  }

  async update(id: string, dto: DraftDto) {
    const row = await this.prisma.barcodeDraft.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("المسودة غير موجودة");
    if (dto.groupId) await this.ensureGroup(dto.groupId);
    const barcode = dto.barcode !== undefined ? normalizeBarcode(dto.barcode) : undefined;
    if (barcode === "") throw new BadRequestException("الباركود فارغ");
    try {
      await this.prisma.barcodeDraft.update({
        where: { id },
        data: {
          groupId: dto.groupId,
          barcode,
          name: dto.name !== undefined ? dto.name.trim() || null : undefined,
          note: dto.note !== undefined ? dto.note.trim() || null : undefined,
          quantity: dto.quantity !== undefined ? dto.quantity : undefined,
          imageIds: dto.imageIds ? await this.validMediaIds(dto.imageIds) : undefined,
          // تغيّر الباركود → نعيد فحص الإضافة
          ...(barcode && barcode !== row.barcode ? { addedAt: null, productId: null, shadeId: null } : {}),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("نفس الباركود محفوظ في هذه المجموعة");
      }
      throw e;
    }
    this.resolvedAt = 0;
    return this.one(id);
  }

  async remove(ids: string[]) {
    const res = await this.prisma.barcodeDraft.deleteMany({ where: { id: { in: ids } } });
    return { deleted: res.count };
  }

  async move(ids: string[], groupId: string) {
    await this.ensureGroup(groupId);
    let moved = 0;
    let merged = 0;
    for (const id of ids) {
      const row = await this.prisma.barcodeDraft.findUnique({ where: { id } });
      if (!row || row.groupId === groupId) continue;
      const clash = await this.prisma.barcodeDraft.findUnique({ where: { groupId_barcode: { groupId, barcode: row.barcode } } });
      if (clash) {
        await this.prisma.barcodeDraft.update({
          where: { id: clash.id },
          data: {
            imageIds: [...new Set([...clash.imageIds, ...row.imageIds])].slice(0, 12),
            name: clash.name ?? row.name,
            note: [clash.note, row.note].filter(Boolean).join(" · ") || null,
          },
        });
        await this.prisma.barcodeDraft.delete({ where: { id } });
        merged += 1;
      } else {
        await this.prisma.barcodeDraft.update({ where: { id }, data: { groupId } });
        moved += 1;
      }
    }
    return { moved, merged };
  }

  // ------------------------------------------------------------ matching

  /**
   * يعلّم المسودات التي صار لها منتج (أو تدرج) بنفس الباركود — يتغير لونها إلى «أضيف».
   * ويرجع المسودة لـ«بانتظار الإضافة» إن حُذف المنتج.
   */
  async resolveAdded(force = false) {
    if (!force && Date.now() - this.resolvedAt < 5_000) return;
    this.resolvedAt = Date.now();
    const pending = await this.prisma.barcodeDraft.findMany({
      where: { addedAt: null },
      select: { id: true, barcode: true },
    });
    if (pending.length) {
      const codes = [...new Set(pending.flatMap((d) => barcodeLookupCandidates(d.barcode)))];
      const [products, shades] = await Promise.all([
        this.prisma.product.findMany({
          where: { OR: [{ barcode: { in: codes } }, { sku: { in: codes } }] },
          select: { id: true, barcode: true, sku: true },
        }),
        this.prisma.productShade.findMany({ where: { barcode: { in: codes } }, select: { id: true, productId: true, barcode: true } }),
      ]);
      const hit = new Map<string, { productId: string; shadeId: string | null }>();
      for (const s of shades) for (const k of barcodeLookupCandidates(s.barcode)) hit.set(k, { productId: s.productId, shadeId: s.id });
      for (const p of products) {
        for (const k of [...barcodeLookupCandidates(p.barcode), ...barcodeLookupCandidates(p.sku)]) hit.set(k, { productId: p.id, shadeId: null });
      }
      const now = new Date();
      for (const d of pending) {
        const m = barcodeLookupCandidates(d.barcode).map((k) => hit.get(k)).find(Boolean);
        if (m) {
          await this.prisma.barcodeDraft.update({ where: { id: d.id }, data: { productId: m.productId, shadeId: m.shadeId, addedAt: now } });
        }
      }
    }
    // منتج حُذف بعد إضافته → المسودة تعود معلّقة
    const added = await this.prisma.barcodeDraft.findMany({ where: { addedAt: { not: null } }, select: { id: true, productId: true } });
    const pids = [...new Set(added.map((a) => a.productId).filter((x): x is string => !!x))];
    if (pids.length) {
      const alive = new Set((await this.prisma.product.findMany({ where: { id: { in: pids } }, select: { id: true } })).map((p) => p.id));
      const gone = added.filter((a) => !a.productId || !alive.has(a.productId)).map((a) => a.id);
      if (gone.length) {
        await this.prisma.barcodeDraft.updateMany({ where: { id: { in: gone } }, data: { addedAt: null, productId: null, shadeId: null } });
      }
    }
  }

  private async findInApp(barcode: string) {
    const codes = barcodeLookupCandidates(barcode);
    const p = await this.prisma.product.findFirst({
      where: { OR: [{ barcode: { in: codes } }, { sku: { in: codes } }] },
      select: { id: true, name: true, nameAr: true },
    });
    if (p) return { productId: p.id, name: p.nameAr || p.name };
    const s = await this.prisma.productShade.findFirst({
      where: { barcode: { in: codes } },
      select: { name: true, product: { select: { id: true, name: true, nameAr: true } } },
    });
    if (s) return { productId: s.product.id, name: `${s.product.nameAr || s.product.name} — ${s.name}` };
    return null;
  }

  private async format(rows: DraftRow[]) {
    const mediaIds = [...new Set(rows.flatMap((r) => r.imageIds))];
    const productIds = [...new Set(rows.map((r) => r.productId).filter((x): x is string => !!x))];
    const userIds = [...new Set(rows.map((r) => r.createdById).filter((x): x is string => !!x))];
    const [media, products, users, pos] = await Promise.all([
      this.mediaMap(mediaIds),
      this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true,
              name: true,
              nameAr: true,
              isActive: true,
              images: { take: 1, orderBy: { position: "asc" }, include: { media: true } },
            },
          }),
      this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
      this.inventory.getSnapshotsMapForBarcodes(rows.map((r) => r.barcode)).catch(() => new Map()),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));
    const userById = new Map(users.map((u) => [u.id, u.name || u.email || ""]));
    return rows.map((r) => {
      const p = r.productId ? productById.get(r.productId) : undefined;
      const snap = barcodeLookupCandidates(r.barcode).map((k) => pos.get(k)).find(Boolean);
      return {
        id: r.id,
        groupId: r.groupId,
        group: r.group,
        barcode: r.barcode,
        name: r.name,
        note: r.note,
        quantity: r.quantity,
        status: r.addedAt ? "added" : "pending",
        addedAt: r.addedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        createdBy: r.createdById ? userById.get(r.createdById) ?? null : null,
        images: r.imageIds.map((id) => media.get(id)).filter(Boolean),
        pos: snap ? { name: snap.name, price: snap.price, stock: snap.stock } : null,
        product: p
          ? {
              id: p.id,
              name: p.nameAr || p.name,
              isActive: p.isActive,
              shadeId: r.shadeId,
              thumb: p.images[0]?.media ? controlMediaUrls(p.images[0].media).thumb : null,
            }
          : null,
      };
    });
  }

  private async mediaMap(ids: string[]) {
    if (!ids.length) return new Map<string, ReturnType<typeof controlMediaUrls>>();
    const rows = await this.prisma.media.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((m) => [m.id, controlMediaUrls(m)]));
  }

  private async validMediaIds(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))].slice(0, 12);
    if (!unique.length) return [];
    const ok = new Set((await this.prisma.media.findMany({ where: { id: { in: unique } }, select: { id: true } })).map((m) => m.id));
    return unique.filter((id) => ok.has(id));
  }

  private async ensureGroup(id: string) {
    const g = await this.prisma.barcodeDraftGroup.findUnique({ where: { id }, select: { id: true } });
    if (!g) throw new NotFoundException("المجموعة غير موجودة");
  }
}
