import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";

@Injectable()
export class SkinConcernsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(activeOnly = true, withCounts = false) {
    const items = await this.prisma.skinConcern.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { position: "asc" },
      include: { image: true },
    });

    if (!withCounts) return items;

    const counts = await this.prisma.productSkinConcern.groupBy({
      by: ["concernId"],
      _count: { concernId: true },
      where: { product: { isActive: true } },
    });
    const countMap = new Map(counts.map((c) => [c.concernId, c._count.concernId]));

    return items.map((item) => ({
      ...item,
      productCount: countMap.get(item.id) ?? 0,
    }));
  }

  async findBySlug(slug: string, page = 1, limit = 20) {
    const concern = await this.prisma.skinConcern.findUnique({ where: { slug } });
    if (!concern || !concern.isActive) throw new NotFoundException("Skin concern not found");

    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      skinConcerns: { some: { concernId: concern.id } },
    };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { soldCount: "desc" },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          images: { take: 1, include: { media: true }, orderBy: { position: "asc" } },
        },
      }),
    ]);

    return {
      concern,
      products: paginate(products, total, page, limit),
    };
  }

  create(data: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    imageId?: string;
    position?: number;
    isActive?: boolean;
  }) {
    return this.prisma.skinConcern.create({
      data: {
        slug: data.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        name: data.name.trim(),
        description: data.description ?? "",
        icon: data.icon ?? null,
        imageId: data.imageId ?? null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(
    id: string,
    data: {
      slug?: string;
      name?: string;
      description?: string;
      icon?: string;
      imageId?: string | null;
      position?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.skinConcern.update({
      where: { id },
      data: {
        ...data,
        slug: data.slug?.trim().toLowerCase().replace(/\s+/g, "-"),
        name: data.name?.trim(),
      },
    });
  }

  remove(id: string) {
    return this.prisma.skinConcern.delete({ where: { id } }).then(() => ({ success: true }));
  }
}
