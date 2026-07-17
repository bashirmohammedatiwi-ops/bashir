import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import {
  CreateSubcategoryDto,
  CreateTertiarySectionDto,
  UpdateSubcategoryDto,
  UpdateTertiarySectionDto,
} from "./dto/category.dto";

const categoryInclude = {
  image: true,
  children: {
    orderBy: { position: "asc" as const },
    include: {
      image: true,
      children: {
        orderBy: { position: "asc" as const },
        include: {
          image: true,
          _count: { select: { tertiaryCategoryProducts: true } },
        },
      },
      _count: { select: { subcategoryProducts: true, children: true } },
    },
  },
  _count: { select: { products: true, children: true } },
};

function normalizeCategoryWrite(data: Record<string, any>, { partial = false } = {}) {
  const hasNameField =
    data.name !== undefined || data.nameAr !== undefined || data.nameEn !== undefined;
  if (partial && !hasNameField) {
    const { name: _n, nameAr: _a, nameEn: _e, ...rest } = data;
    return rest;
  }
  const nameAr = String(data.nameAr ?? data.name ?? "").trim() || null;
  const nameEn = String(data.nameEn ?? "").trim() || null;
  const name = nameAr || nameEn || String(data.name || "").trim();
  if (!name) {
    throw new BadRequestException("Category name is required");
  }
  return {
    ...data,
    name,
    nameAr: nameAr || name,
    nameEn,
  };
}

function mapTertiarySection(c: any) {
  return {
    ...c,
    name: c.nameAr || c.name,
    nameAr: c.nameAr || c.name,
    nameEn: c.nameEn || null,
    productCount: c._count?.tertiaryCategoryProducts ?? 0,
    parentName: c.parent?.nameAr || c.parent?.name,
    grandparentId: c.parent?.parentId ?? c.parent?.parent?.id,
    grandparentName: c.parent?.parent?.nameAr || c.parent?.parent?.name,
  };
}

function mapSubcategory(c: any) {
  return {
    ...c,
    name: c.nameAr || c.name,
    nameAr: c.nameAr || c.name,
    nameEn: c.nameEn || null,
    productCount: c._count?.subcategoryProducts ?? 0,
    tertiaryCount: c._count?.children ?? c.children?.length ?? 0,
    parentName: c.parent?.nameAr || c.parent?.name,
    children: c.children?.map(mapTertiarySection),
  };
}

function mapCategory(c: any) {
  return {
    ...c,
    name: c.nameAr || c.name,
    nameAr: c.nameAr || c.name,
    nameEn: c.nameEn || null,
    productCount: c._count?.products ?? 0,
    subcategoriesCount: c._count?.children ?? c.children?.length ?? 0,
    children: c.children?.map(mapSubcategory),
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private subcategoryWhere(parentId?: string, all?: boolean): Prisma.CategoryWhereInput {
    return {
      parent: { parentId: null },
      ...(parentId ? { parentId } : {}),
      ...(all ? {} : { isActive: true }),
    };
  }

  private tertiaryWhere(parentId?: string, all?: boolean): Prisma.CategoryWhereInput {
    return {
      parent: { parent: { parentId: null } },
      ...(parentId ? { parentId } : {}),
      ...(all ? {} : { isActive: true }),
    };
  }

  async list(all = false, minimal = false) {
    if (minimal) {
      const rows = await this.prisma.category.findMany({
        where: { isActive: all ? undefined : true, parentId: null },
        orderBy: { position: "asc" },
        include: {
          image: true,
          _count: { select: { children: true } },
        },
      });
      return rows.map((c) => ({
        id: c.id,
        name: c.nameAr || c.name,
        nameAr: c.nameAr || c.name,
        nameEn: c.nameEn || null,
        slug: c.slug,
        icon: c.icon,
        position: c.position,
        isActive: c.isActive,
        image: c.image,
        children: [],
      }));
    }
    const rows = await this.prisma.category.findMany({
      where: { isActive: all ? undefined : true, parentId: null },
      orderBy: { position: "asc" },
      include: {
        ...categoryInclude,
        children: {
          where: { isActive: all ? undefined : true },
          orderBy: { position: "asc" },
          include: {
            image: true,
            children: {
              where: { isActive: all ? undefined : true },
              orderBy: { position: "asc" },
              include: {
                image: true,
                _count: { select: { tertiaryCategoryProducts: true } },
              },
            },
            _count: { select: { subcategoryProducts: true, children: true } },
          },
        },
      },
    });
    return rows.map(mapCategory);
  }

  async listSecondarySections(opts: {
    parentId?: string;
    all?: boolean;
    search?: string;
  }) {
    const where: Prisma.CategoryWhereInput = {
      ...this.subcategoryWhere(opts.parentId, opts.all),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search } },
              { nameAr: { contains: opts.search } },
              { nameEn: { contains: opts.search } },
              { slug: { contains: opts.search } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.category.findMany({
      where,
      orderBy: [{ parent: { position: "asc" } }, { position: "asc" }],
      include: {
        image: true,
        parent: {
          select: { id: true, name: true, nameAr: true, nameEn: true, slug: true, icon: true },
        },
        children: {
          orderBy: { position: "asc" },
          include: {
            image: true,
            _count: { select: { tertiaryCategoryProducts: true } },
          },
        },
        _count: { select: { subcategoryProducts: true, children: true } },
      },
    });
    return rows.map(mapSubcategory);
  }

  async listTertiarySections(opts: {
    parentId?: string;
    all?: boolean;
    search?: string;
  }) {
    const where: Prisma.CategoryWhereInput = {
      ...this.tertiaryWhere(opts.parentId, opts.all),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search } },
              { nameAr: { contains: opts.search } },
              { nameEn: { contains: opts.search } },
              { slug: { contains: opts.search } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.category.findMany({
      where,
      orderBy: [{ parent: { position: "asc" } }, { position: "asc" }],
      include: {
        image: true,
        parent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameAr: true, nameEn: true, slug: true } },
          },
        },
        _count: { select: { tertiaryCategoryProducts: true } },
      },
    });
    return rows.map(mapTertiarySection);
  }

  async listSubcategories(parentIdOrSlug: string, all = false) {
    const parent = await this.prisma.category.findFirst({
      where: { OR: [{ id: parentIdOrSlug }, { slug: parentIdOrSlug }] },
    });
    if (!parent) throw new NotFoundException("Parent category not found");
    return this.listSecondarySections({ parentId: parent.id, all });
  }

  async findSubcategory(idOrSlug: string) {
    const row = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        parent: { parentId: null },
        parentId: { not: null },
      },
      include: {
        image: true,
        parent: { select: { id: true, name: true, nameAr: true, nameEn: true, slug: true } },
        _count: { select: { subcategoryProducts: true, children: true } },
      },
    });
    if (!row) throw new NotFoundException("Subcategory not found");
    return mapSubcategory(row);
  }

  async findTertiarySection(idOrSlug: string) {
    const row = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        parent: { parent: { parentId: null } },
        parentId: { not: null },
      },
      include: {
        image: true,
        parent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, nameAr: true, nameEn: true, slug: true } },
          },
        },
        _count: { select: { tertiaryCategoryProducts: true } },
      },
    });
    if (!row) throw new NotFoundException("Tertiary section not found");
    return mapTertiarySection(row);
  }

  async findOne(idOrSlug: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], parentId: null },
      include: categoryInclude,
    });
    if (!category) throw new NotFoundException("Category not found");
    return mapCategory(category);
  }

  async create(data: any) {
    if (data.parentId) {
      throw new BadRequestException("Use POST /subcategories to create sub-sections");
    }
    const row = await this.prisma.category.create({ data: normalizeCategoryWrite(data) });
    return this.findOne(row.id);
  }

  async createSubcategory(data: CreateSubcategoryDto) {
    const parent = await this.prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new BadRequestException("Parent section not found");
    if (parent.parentId) throw new BadRequestException("Parent must be a top-level section");
    const row = await this.prisma.category.create({
      data: { ...normalizeCategoryWrite(data), parentId: data.parentId },
    });
    return this.findSubcategory(row.id);
  }

  async createTertiarySection(data: CreateTertiarySectionDto) {
    const parent = await this.prisma.category.findUnique({
      where: { id: data.parentId },
      include: { parent: { select: { parentId: true } } },
    });
    if (!parent?.parentId) {
      throw new BadRequestException("Parent must be a sub-section");
    }
    if (parent.parent?.parentId) {
      throw new BadRequestException("Cannot nest more than three category levels");
    }
    const row = await this.prisma.category.create({
      data: { ...normalizeCategoryWrite(data), parentId: data.parentId },
    });
    return this.findTertiarySection(row.id);
  }

  async update(id: string, data: any) {
    await this.ensureRootSection(id);
    if (data.parentId) {
      throw new BadRequestException("Use PATCH /subcategories/:id for sub-sections");
    }
    await this.prisma.category.update({
      where: { id },
      data: normalizeCategoryWrite(data, { partial: true }),
    });
    return this.findOne(id);
  }

  async updateSubcategory(id: string, data: UpdateSubcategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: { select: { parentId: true } } },
    });
    if (!existing?.parentId || existing.parent?.parentId) {
      throw new NotFoundException("Subcategory not found");
    }
    const parentId = data.parentId ?? existing.parentId;
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) {
      throw new BadRequestException("Parent must be a top-level section");
    }
    await this.prisma.category.update({
      where: { id },
      data: { ...normalizeCategoryWrite(data, { partial: true }), parentId },
    });
    return this.findSubcategory(id);
  }

  async updateTertiarySection(id: string, data: UpdateTertiarySectionDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: { include: { parent: { select: { parentId: true } } } } },
    });
    if (!existing?.parentId || !existing.parent?.parentId || existing.parent.parent?.parentId) {
      throw new NotFoundException("Tertiary section not found");
    }
    const parentId = data.parentId ?? existing.parentId;
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
      include: { parent: { select: { parentId: true } } },
    });
    if (!parent?.parentId || parent.parent?.parentId) {
      throw new BadRequestException("Parent must be a sub-section");
    }
    await this.prisma.category.update({
      where: { id },
      data: { ...normalizeCategoryWrite(data, { partial: true }), parentId },
    });
    return this.findTertiarySection(id);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const children = await this.prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    for (const child of children) {
      await this.remove(child.id);
    }
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null, subcategoryId: null, tertiaryCategoryId: null },
    });
    await this.prisma.product.updateMany({
      where: { subcategoryId: id },
      data: { subcategoryId: null, tertiaryCategoryId: null },
    });
    await this.prisma.product.updateMany({
      where: { tertiaryCategoryId: id },
      data: { tertiaryCategoryId: null },
    });
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async validateSubcategoryForCategory(
    subcategoryId: string | undefined | null,
    categoryId: string | undefined | null,
  ) {
    if (!subcategoryId) return null;
    if (!categoryId) {
      throw new BadRequestException("اختر القسم الرئيسي قبل القسم الفرعي");
    }
    const sub = await this.prisma.category.findUnique({
      where: { id: subcategoryId },
      include: { parent: { select: { parentId: true } } },
    });
    if (!sub?.parentId || sub.parent?.parentId) {
      throw new BadRequestException("Invalid sub-section");
    }
    if (sub.parentId !== categoryId) {
      throw new BadRequestException("Sub-section does not belong to the selected section");
    }
    if (!sub.isActive) {
      throw new BadRequestException("Sub-section is inactive");
    }
    return subcategoryId;
  }

  async validateTertiaryForProduct(
    tertiaryCategoryId: string | undefined | null,
    subcategoryId: string | undefined | null,
    categoryId: string | undefined | null,
  ) {
    if (!tertiaryCategoryId) return null;
    if (!subcategoryId) {
      throw new BadRequestException("Select a sub-section before choosing a tertiary section");
    }
    const tertiary = await this.prisma.category.findUnique({
      where: { id: tertiaryCategoryId },
      include: {
        parent: {
          include: { parent: { select: { id: true, parentId: true } } },
        },
      },
    });
    if (!tertiary?.parentId || !tertiary.parent?.parentId || tertiary.parent.parent?.parentId) {
      throw new BadRequestException("Invalid tertiary section");
    }
    if (tertiary.parentId !== subcategoryId) {
      throw new BadRequestException("Tertiary section does not belong to the selected sub-section");
    }
    if (tertiary.parent.parentId !== categoryId) {
      throw new BadRequestException("Tertiary section does not belong to the selected section");
    }
    if (!tertiary.isActive) {
      throw new BadRequestException("Tertiary section is inactive");
    }
    return tertiaryCategoryId;
  }

  private async ensureRootSection(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Category not found");
    if (c.parentId) throw new NotFoundException("Category not found");
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Category not found");
  }
}
