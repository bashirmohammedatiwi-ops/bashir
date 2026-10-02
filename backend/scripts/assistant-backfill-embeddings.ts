/**
 * يولّد embeddings لكل المنتجات النشطة (دفعة واحدة عند النشر أو عند تغيّر
 * المستند). قابل للاستئناف — يتخطى المنتجات ذات docHash غير المتغيّر.
 * Usage: npx tsx scripts/assistant-backfill-embeddings.ts [--force]
 * Needs: OPENAI_API_KEY
 */
import { PrismaClient } from "@prisma/client";
import { OpenAiProvider } from "../src/modules/assistant/ai/openai.provider";
import { buildEmbeddingDocument, searchDocHash, type SearchDocProduct } from "../src/modules/assistant/retrieval/search-document";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");
const MODEL = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const BATCH = Number(process.env.EMBED_BATCH ?? 48);

const include = {
  brand: { select: { name: true } },
  category: { select: { name: true, nameAr: true } },
  subcategory: { select: { name: true, nameAr: true } },
  tertiaryCategory: { select: { name: true, nameAr: true } },
  subcategories: { select: { name: true, nameAr: true } },
  tertiaryCategories: { select: { name: true, nameAr: true } },
  shades: { select: { name: true } },
  variants: { select: { label: true, sizeLabel: true } },
} as const;

async function main() {
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("OPENAI_API_KEY is required");
    process.exitCode = 1;
    return;
  }
  const provider = new OpenAiProvider(apiKey, process.env.AI_BASE_URL ?? "https://api.openai.com/v1", 60_000);

  const total = await prisma.product.count({ where: { isActive: true } });
  console.log(`Embedding ${total} active products (model=${MODEL}${force ? ", force" : ""})…`);

  let cursor: string | undefined;
  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (;;) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      include,
    });
    if (!products.length) break;
    cursor = products[products.length - 1].id;

    const docs = products.map((p) => buildEmbeddingDocument(p as SearchDocProduct));
    const existing = await prisma.productEmbedding.findMany({
      where: { productId: { in: products.map((p) => p.id) } },
      select: { productId: true, docHash: true },
    });
    const hashById = new Map(existing.map((e) => [e.productId, e.docHash]));

    const pending = products
      .map((p, i) => ({ p, doc: docs[i], hash: searchDocHash(docs[i]) }))
      .filter(({ p, hash }) => force || hashById.get(p.id) !== hash);

    skipped += products.length - pending.length;

    if (pending.length) {
      try {
        const vectors = await provider.embed(pending.map((x) => x.doc));
        await prisma.$transaction(
          pending.map((x, i) =>
            prisma.productEmbedding.upsert({
              where: { productId: x.p.id },
              create: { productId: x.p.id, model: MODEL, dims: vectors[i].length, embedding: encode(vectors[i]), docHash: x.hash },
              update: { model: MODEL, dims: vectors[i].length, embedding: encode(vectors[i]), docHash: x.hash },
            }),
          ),
        );
        done += pending.length;
      } catch (err) {
        failed += pending.length;
        console.warn(`batch failed (${(err as Error).message}) — continuing`);
      }
    }
    process.stdout.write(`\r${done + skipped}/${total} (embedded=${done}, skipped=${skipped}, failed=${failed})`);
  }

  console.log(`\nDone. embedded=${done}, skipped=${skipped}, failed=${failed}`);
}

function encode(vector: number[]): string {
  const buffer = new ArrayBuffer(vector.length * 4);
  const view = new DataView(buffer);
  vector.forEach((value, i) => view.setFloat32(i * 4, value, true));
  return Buffer.from(buffer).toString("base64");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
