import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { CreateSubcategoryDto, UpdateSubcategoryDto } from "./dto/category.dto";

const categoryInclude = {
  image: true,
  children: {
    orderBy: { position: "asc" as const },
    include: {
      image: true,
      _count: { select: { subcategoryProducts: true } },
    },
  },
  _count: { select: { products: true, children: true } },
};

function mapCategory(c: any) {
  return {
    ...c,
    productCount: c._count?.products ?? 0,
    subcategoriesCount: c._count?.children ?? c.children?.length ?? 0,
    children: c.children?.map((child: any) => ({
      ...child,
      productCount: child._count?.subcategoryProducts ?? 0,
    })),
  };
}

function mapSubcategory(c: any) {
  return {
    ...c,
    productCount: c._count?.subcategoryProducts ?? 0,
    parentName: c.parent?.name,
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

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
        name: c.name,
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
            _count: { select: { subcategoryProducts: true } },
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
      parentId: { not: null },
      ...(opts.parentId ? { parentId: opts.parentId } : {}),
      ...(opts.all ? {} : { isActive: true }),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search } },
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
        parent: { select: { id: true, name: true, slug: true, icon: true } },
        _count: { select: { subcategoryProducts: true } },
      },
    });
    return rows.map(mapSubcategory);
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
        parentId: { not: null },
      },
      include: {
        image: true,
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { subcategoryProducts: true } },
      },
    });
    if (!row) throw new NotFoundException("Subcategory not found");
    return mapSubcategory(row);
  }

  async findOne(idOrSlug: string) {
    const category = await this.prisma.category.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: categoryInclude,
    });
    if (!category) throw new NotFoundException("Category not found");
    return mapCategory(category);
  }

  async create(data: any) {
    if (data.parentId) {
      throw new BadRequestException("Use POST /subcategories to create secondary sections");
    }
    const row = await this.prisma.category.create({ data });
    return this.findOne(row.id);
  }

  async createSubcategory(data: CreateSubcategoryDto) {
    const parent = await this.prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new BadRequestException("Parent category not found");
    if (parent.parentId) throw new BadRequestException("Cannot nest subcategories");
    const row = await this.prisma.category.create({
      data: { ...data, parentId: data.parentId },
    });
    return this.findSubcategory(row.id);
  }

  async update(id: string, data: any) {
    await this.ensureExists(id);
    if (data.parentId) {
      throw new BadRequestException("Use PATCH /subcategories/:id for secondary sections");
    }
    await this.prisma.category.update({ where: { id }, data });
    return this.findOne(id);
  }

  async updateSubcategory(id: string, data: UpdateSubcategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing?.parentId) throw new NotFoundException("Subcategory not found");
    const parent = await this.prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new BadRequestException("Parent category not found");
    if (parent.parentId) throw new BadRequestException("Invalid parent category");
    await this.prisma.category.update({ where: { id }, data });
    return this.findSubcategory(id);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.updateMany({
      where: { subcategoryId: id },
      data: { subcategoryId: null },
    });
    await this.prisma.category.deleteMany({ where: { parentId: id } });
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async validateSubcategoryForCategory(subcategoryId: string | undefined | null, categoryId: string) {
    if (!subcategoryId) return null;
    const sub = await this.prisma.category.findUnique({ where: { id: subcategoryId } });
    if (!sub?.parentId) {
      throw new BadRequestException("Invalid subcategory");
    }
    if (sub.parentId !== categoryId) {
      throw new BadRequestException("Subcategory does not belong to the selected category");
    }
    if (!sub.isActive) {
      throw new BadRequestException("Subcategory is inactive");
    }
    return subcategoryId;
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Category not found");
  }
}
