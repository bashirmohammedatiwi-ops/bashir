const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const mediaRoot = process.env.MEDIA_ROOT || "/data/uploads";
const publicBase = (process.env.MEDIA_PUBLIC_BASE_URL || "https://deemaalhayat.com/media").replace(/\/$/, "");
const dir = process.env.ICON_DIR || "/tmp/main-icons";

const MAP = {
  "cat-devices.png": "3e5e60af-8828-4894-b192-d2988d6f5a48",
  "cat-nails.png": "84084ccc-f185-499c-8d0b-97d2ba2d0686",
  "cat-health.png": "7123c328-9edf-46a9-9d5d-a1993a71af11",
  "cat-perfumes.png": "975e0e23-edd2-4181-ad6d-ecade6452b95",
  "cat-care.png": "9f99dbf3-15c4-4561-8f53-1499a8743a47",
  "cat-makeup.png": "d3c24d19-dde5-41e5-b0a9-bede45393795",
  "cat-gifts.png": "90c89e67-aa43-4f55-8cd6-efed255e1126",
  "cat-premium.png": "09f69d8a-f6d4-41f5-8fb5-a3b0e7e302d5",
  "cat-lenses.png": "74e0a4ac-20e6-437f-8e2a-1858eecf969c",
  "cat-home.png": "06f8d36f-a094-4252-ae28-cba993445c8f",
};

async function saveMedia(png, alt) {
  const webp = await sharp(png).webp({ quality: 88 }).toBuffer();
  const jpg = await sharp(png).jpeg({ quality: 88 }).toBuffer();
  const thumb = await sharp(png).resize(320, 320).webp({ quality: 82 }).toBuffer();
  const hash = crypto.createHash("sha1").update(webp).update(jpg).digest("hex");
  const existing = await prisma.media.findUnique({ where: { hash } });
  if (existing) return existing;
  const now = new Date();
  const subdir = path.posix.join("general", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const absDir = path.join(mediaRoot, subdir);
  await fs.mkdir(absDir, { recursive: true });
  const base = hash.slice(0, 16);
  await fs.writeFile(path.join(absDir, `${base}.webp`), webp);
  await fs.writeFile(path.join(absDir, `${base}.jpg`), jpg);
  await fs.writeFile(path.join(absDir, `${base}_thumb.webp`), thumb);
  const publicUrlBase = `${publicBase}/${subdir}`;
  return prisma.media.create({
    data: {
      purpose: "GENERAL",
      filename: base,
      originalName: alt,
      mime: "image/webp",
      bytes: webp.length + jpg.length + thumb.length,
      width: 512,
      height: 512,
      hash,
      storagePath: subdir,
      publicUrlBase,
      variants: { thumb: { width: 320, formats: { webp: `${publicUrlBase}/${base}_thumb.webp` } } },
      alt,
    },
  });
}

async function main() {
  for (const [file, id] of Object.entries(MAP)) {
    const raw = await fs.readFile(path.join(dir, file));
    const png = await sharp(raw).resize(512, 512, { fit: "cover" }).png().toBuffer();
    const media = await saveMedia(png, file);
    await prisma.category.update({ where: { id }, data: { imageId: media.id } });
    console.log("ok", file, media.filename);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
