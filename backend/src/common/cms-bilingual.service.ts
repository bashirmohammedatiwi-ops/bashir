import { Injectable } from "@nestjs/common";
import type { ResolvedHomeSection } from "../modules/home/home-section.resolver";
import { TranslationService } from "./translation.service";

type BilingualPair = { ar?: string | null; en?: string | null };
type Slot = BilingualPair & { apply: (v: string) => void };

@Injectable()
export class CmsBilingualService {
  constructor(private readonly translation: TranslationService) {}

  async enrichBanners<T extends Record<string, unknown>>(banners: T[]): Promise<T[]> {
    if (!banners.length) return banners;
    const slots: Slot[] = [];

    for (const banner of banners) {
      for (const field of ["title", "subtitle", "tag", "ctaLabel", "discountText"] as const) {
        const enKey = `${field}En` as keyof T;
        this.queue(slots, banner[field] as string, banner[enKey] as string, (v) => {
          banner[enKey] = v as T[keyof T];
        });
      }
    }

    await this.applySlots(slots);
    return banners;
  }

  async enrichSections(sections: ResolvedHomeSection[]): Promise<ResolvedHomeSection[]> {
    if (!sections.length) return sections;
    const cloned = sections.map((s) => this.cloneSection(s));
    const slots: Slot[] = [];

    const walk = (section: ResolvedHomeSection) => {
      this.collectSectionSlots(section, slots);
      section.children?.forEach(walk);
    };
    cloned.forEach(walk);

    await this.applySlots(slots);
    return cloned;
  }

  async enrichHomeBlockData(data: {
    title?: string | null;
    titleEn?: string | null;
    subtitle?: string | null;
    subtitleEn?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<typeof data> {
    const out = { ...data, payload: data.payload ? { ...data.payload } : undefined };
    out.titleEn = await this.translation.ensureEn(data.title, data.titleEn);
    out.subtitleEn = await this.translation.ensureEn(data.subtitle, data.subtitleEn);

    if (out.payload) {
      out.payload = await this.enrichPayload(out.payload);
      const children = out.payload.children;
      if (Array.isArray(children)) {
        out.payload.children = await Promise.all(
          children.map(async (child: Record<string, unknown>) => {
            const c = { ...child };
            c.titleEn = await this.translation.ensureEn(
              c.title as string,
              c.titleEn as string,
            );
            if (c.payload && typeof c.payload === "object") {
              c.payload = await this.enrichPayload(c.payload as Record<string, unknown>);
            }
            return c;
          }),
        );
      }
    }
    return out;
  }

  async enrichBannerData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const out = { ...data };
    for (const field of ["title", "subtitle", "tag", "ctaLabel", "discountText"] as const) {
      const enKey = `${field}En`;
      out[enKey] = await this.translation.ensureEn(
        out[field] as string,
        out[enKey] as string,
      );
    }
    return out;
  }

  private async enrichPayload(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const out = { ...payload };
    out.textEn = await this.translation.ensureEn(out.text as string, out.textEn as string);
    out.labelEn = await this.translation.ensureEn(out.label as string, out.labelEn as string);
    out.titleEn = await this.translation.ensureEn(out.title as string, out.titleEn as string);
    out.subtitleEn = await this.translation.ensureEn(out.subtitle as string, out.subtitleEn as string);

    if (Array.isArray(out.items)) {
      const enItems = Array.isArray(out.itemsEn) ? [...(out.itemsEn as string[])] : [];
      const arItems = out.items as unknown[];
      for (let i = 0; i < arItems.length; i++) {
        const item = arItems[i];
        if (typeof item === "string") {
          enItems[i] = await this.translation.ensureEn(item, enItems[i]);
          continue;
        }
        if (!item || typeof item !== "object") continue;
        const row = { ...(item as Record<string, unknown>) };
        row.titleEn = await this.translation.ensureEn(row.title as string, row.titleEn as string);
        row.subtitleEn = await this.translation.ensureEn(
          row.subtitle as string,
          row.subtitleEn as string,
        );
        arItems[i] = row;
      }
      out.items = arItems;
      if (enItems.length) out.itemsEn = enItems;
    }

    return out;
  }

  private collectSectionSlots(section: ResolvedHomeSection, slots: Slot[]) {
    this.queue(slots, section.title, section.titleEn, (v) => {
      section.titleEn = v;
    });
    this.queue(slots, section.subtitle, section.subtitleEn, (v) => {
      section.subtitleEn = v;
    });

    const strip = section.promoStrip;
    if (strip) {
      this.queue(slots, strip.text, strip.textEn, (v) => {
        strip.textEn = v;
      });
      this.queue(slots, strip.label, strip.labelEn, (v) => {
        strip.labelEn = v;
      });
      strip.items?.forEach((line, i) => {
        if (!strip.itemsEn) strip.itemsEn = [];
        this.queue(slots, line, strip.itemsEn[i], (v) => {
          strip.itemsEn![i] = v;
        });
      });
    }

    section.items?.forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const item = raw as Record<string, unknown>;
      this.queue(slots, item.title as string, item.titleEn as string, (v) => {
        item.titleEn = v;
      });
      this.queue(slots, item.subtitle as string, item.subtitleEn as string, (v) => {
        item.subtitleEn = v;
      });
    });

    section.banners?.forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const b = raw as Record<string, unknown>;
      for (const field of ["title", "subtitle", "tag", "discountText", "ctaLabel"] as const) {
        const enField = `${field}En`;
        this.queue(slots, b[field] as string, b[enField] as string, (v) => {
          b[enField] = v;
        });
      }
    });
  }

  private queue(
    slots: Slot[],
    ar?: string | null,
    en?: string | null,
    apply?: (v: string) => void,
  ) {
    if (!(ar ?? "").trim() || (en ?? "").trim()) return;
    slots.push({ ar, en, apply: apply ?? (() => {}) });
  }

  private async applySlots(slots: Slot[]) {
    if (!slots.length) return;
    const translated = await this.translation.ensureEnBatch(slots);
    translated.forEach((v, i) => slots[i].apply(v));
  }

  private cloneSection(section: ResolvedHomeSection): ResolvedHomeSection {
    return {
      ...section,
      promoStrip: section.promoStrip
        ? {
            ...section.promoStrip,
            items: [...(section.promoStrip.items ?? [])],
            itemsEn: section.promoStrip.itemsEn
              ? [...section.promoStrip.itemsEn]
              : undefined,
          }
        : undefined,
      items: Array.isArray(section.items)
        ? section.items.map((i) => (i && typeof i === "object" ? { ...(i as object) } : i))
        : section.items,
      banners: Array.isArray(section.banners)
        ? section.banners.map((b) => (b && typeof b === "object" ? { ...(b as object) } : b))
        : section.banners,
      children: section.children?.map((c) => this.cloneSection(c)) ?? [],
    };
  }
}
