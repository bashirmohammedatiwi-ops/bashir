/**
 * Generates a consistent rose line-icon for every category missing an image
 * and attaches it through the same Media records the admin panel uses.
 */
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const mediaRoot = process.env.MEDIA_ROOT || "/data/uploads";
const publicBase = (process.env.MEDIA_PUBLIC_BASE_URL || "https://deemaalhayat.com/media").replace(/\/$/, "");

const RULES = [
  [/device|جهاز|ماكين|مقياس|ميزان|ضغط|حرار/, "device"],
  [/nail|ظفر|طلاء/, "nail"],
  [/perfume|عطر|oud|عود|musk|مسك|بخور|مباخر|fragrance/, "perfume"],
  [/gift|هدي/, "gift"],
  [/lens|عدس/, "lens"],
  [/home|منزل|جو|شمع|candle|diffuser|معطر/, "home"],
  [/premium|فاخر|نيش|luxury|niche/, "premium"],
  [/lip|شف|روج|gloss/, "lip"],
  [/eye|عين|كحل|ماسكرا|ايشادو|mascara|shadow/, "eye"],
  [/brow|حاجب/, "brow"],
  [/cheek|خد|بلاشر|برونز|blush|bronzer/, "cheek"],
  [/face|وجه|فاوند|كونسيلر|بودرة|برايمر|كونتور|foundation|powder|primer/, "face"],
  [/highlight/, "highlight"],
  [/brush|فرش|اسفنج|sponge/, "brush"],
  [/hair|شعر|شامبو|صبغ|لحية|beard/, "hair"],
  [/body|جسم|مزيل|عرق|تان/, "body"],
  [/foot|قدم/, "foot"],
  [/hand|يد/, "hand"],
  [/sun|شمس/, "sun"],
  [/baby|طفل|أم|mom/, "baby"],
  [/oral|فم|أسنان|معجون|فرش أسنان|tooth/, "oral"],
  [/vitamin|مكمل|بروتين|صح|تغذ|vitamin|whey|creatine/, "health"],
  [/sport|رياض|تمرين|workout/, "sport"],
  [/korean|كوري/, "korean"],
  [/makeup|مكياج/, "makeup"],
  [/care|عناية|ترطيب|غسول|ماسك|مقشر/, "care"],
];

const COLORS = {
  device: "#7A4E9A",
  nail: "#E23D6B",
  perfume: "#C4A35A",
  gift: "#D41F5C",
  lens: "#3D7EA6",
  home: "#C47B4A",
  premium: "#B8954A",
  lip: "#E11D48",
  eye: "#6B4C9A",
  brow: "#8D6E63",
  cheek: "#E57A9A",
  face: "#D46A8A",
  highlight: "#D4A24C",
  brush: "#A15C7A",
  hair: "#6B3A4A",
  body: "#D4789A",
  foot: "#C48B6A",
  hand: "#E08AA4",
  sun: "#E6A23C",
  baby: "#E89AAB",
  oral: "#3E8E86",
  health: "#2F9E6B",
  sport: "#3C6E9A",
  korean: "#E85A8C",
  makeup: "#D41F5C",
  care: "#C45C7A",
  generic: "#D41F5C",
};

const SHAPES = {
  device: `<rect x="78" y="28" width="84" height="150" rx="16"/><path d="M108 52h24M100 168h40"/>`,
  nail: `<path d="M96 36c0-16 48-16 48 0v90c0 28-48 28-48 0z"/><path d="M96 110h48"/>`,
  perfume: `<path d="M108 24h24v22h-24z"/><path d="M92 46h56v120a18 18 0 0 1-18 18h-20a18 18 0 0 1-18-18z"/>`,
  gift: `<rect x="52" y="78" width="136" height="100" rx="12"/><path d="M52 112h136M120 78v100M120 78c-18-28-46-8-28 8M120 78c18-28 46-8 28 8"/>`,
  lens: `<circle cx="120" cy="112" r="46"/><circle cx="120" cy="112" r="16"/><path d="M74 112h-16M182 112h-16"/>`,
  home: `<path d="M40 100 L120 40 L200 100 V180 H40 Z"/><path d="M100 180v-40h40v40"/>`,
  premium: `<path d="M120 36l18 40 44 6-32 30 8 44-38-20-38 20 8-44-32-30 44-6z"/>`,
  lip: `<path d="M60 110c20-36 40-36 60 0 20-36 40-36 60 0-10 40-40 62-60 62s-50-22-60-62z"/>`,
  eye: `<path d="M28 112c32-48 152-48 184 0-32 48-152 48-184 0z"/><circle cx="120" cy="112" r="22"/>`,
  brow: `<path d="M36 130c40-50 128-50 168-10"/><path d="M70 150c20 16 50 16 80-8"/>`,
  cheek: `<circle cx="120" cy="112" r="48"/><path d="M88 128c12 16 52 16 64 0"/>`,
  face: `<circle cx="120" cy="100" r="52"/><path d="M92 168c12 20 44 20 56 0"/>`,
  highlight: `<path d="M120 28v28M120 168v28M40 112h28M172 112h28M62 54l20 20M158 150l20 20M62 170l20-20M158 54l20-20"/>`,
  brush: `<path d="M150 36l28 28-78 78-28-28z"/><path d="M72 142l-24 40"/>`,
  hair: `<path d="M70 170c0-70 20-120 50-120s50 50 50 120"/><path d="M90 80c10 20 30 20 40 0"/>`,
  body: `<circle cx="120" cy="52" r="18"/><path d="M80 180c0-50 18-70 40-70s40 20 40 70"/>`,
  foot: `<path d="M70 150c0-40 20-70 40-70 30 0 36 30 50 30 16 0 20 24 10 40-16 28-50 40-80 28-16-6-20-16-20-28z"/>`,
  hand: `<path d="M90 180V90M110 180V60M130 180V70M150 180V96M90 90c0-16 40-16 40 6"/>`,
  sun: `<circle cx="120" cy="112" r="28"/><path d="M120 48v20M120 156v20M56 112h20M164 112h20M74 66l14 14M152 144l14 14M74 158l14-14M152 80l14-14"/>`,
  baby: `<circle cx="120" cy="88" r="28"/><path d="M78 180c6-40 22-58 42-58s36 18 42 58"/>`,
  oral: `<path d="M78 70h84v70a42 42 0 0 1-84 0z"/><path d="M108 70v-20h24v20"/>`,
  health: `<path d="M120 40v144M48 112h144"/>`,
  sport: `<circle cx="120" cy="112" r="58"/><path d="M78 80c20 16 64 16 84 0M78 144c20-16 64-16 84 0M120 54v116"/>`,
  korean: `<circle cx="120" cy="112" r="58"/><path d="M120 54v116M62 112h116"/>`,
  makeup: `<path d="M70 160l20-90 20 90M130 70h50M130 100h40M130 130h50"/>`,
  care: `<path d="M120 170c-40-24-58-52-58-80a28 28 0 0 1 50-16 28 28 0 0 1 50 16c0 28-18 56-42 80z"/>`,
  generic: `<circle cx="120" cy="112" r="46"/><path d="M120 86v36l24 14"/>`,
};

function pickShape(nameAr, nameEn) {
  const blob = `${nameAr} ${nameEn}`.toLowerCase();
  for (const [re, key] of RULES) {
    if (re.test(blob)) return key;
  }
  return "generic";
}

function svgFor(nameAr, nameEn) {
  const key = pickShape(nameAr, nameEn);
  const color = COLORS[key] || COLORS.generic;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF8FA"/>
      <stop offset="1" stop-color="#F8E7EE"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bg)"/>
  <circle cx="256" cy="248" r="148" fill="${color}"/>
  <circle cx="256" cy="248" r="148" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="10"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="translate(136 128)">
    ${SHAPES[key] || SHAPES.generic}
  </g>
</svg>`;
}

async function saveMedia(png, alt) {
  const webp = await sharp(png).webp({ quality: 86 }).toBuffer();
  const jpg = await sharp(png).jpeg({ quality: 86 }).toBuffer();
  const thumb = await sharp(png).resize(320, 320).webp({ quality: 80 }).toBuffer();
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
      originalName: alt.slice(0, 80),
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

function labelOf(row) {
  if (!row) return "";
  return row.nameEn || row.nameAr || row.name || "";
}

async function generatePng(row) {
  const nameAr = row.nameAr || row.name;
  const nameEn = row.nameEn || row.name;
  const parentEn = labelOf(row.parent);
  const grandEn = labelOf(row.parent?.parent);
  const pathLabel = [grandEn, parentEn, nameEn].filter(Boolean).join(" › ");
  const prompt = [
    "Professional catalog photograph for a luxury beauty app.",
    "Square, no text, no letters, no logo, no watermark, no collage, no people, no hands.",
    process.env.ICON_ROOTS === "1"
      ? "Background must be pure clean white, like a studio product shot. Nothing else in the background."
      : "Background is only soft blush ivory (#FFF7F9 to #F8F5F6) with a whisper of rose light.",
    "Packaging in white, clear glass, or pale rose with a slim gold accent. Photoreal, sharp, centered.",
    `Catalog path: ${pathLabel}.`,
    `Hero object must be instantly recognizable as exactly: ${nameEn} (${nameAr}).`,
    "Examples of specificity: a sculpted lipstick bullet, a slim liquid-lip tube, a gloss wand, a mascara brush, an eyeshadow quad, a round blush compact, a frosted shampoo bottle, a glass serum dropper, a faceted perfume flacon, a polished oud chip, a contact-lens case, a nail-polish bottle.",
    "One centered product, generous empty blush space, photoreal, editorial, very elegant, very calm.",
  ].join(" ");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(JSON.stringify(json?.error || json).slice(0, 500));
    err.status = res.status;
    throw err;
  }
  const b64 = json.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = json.data?.[0]?.url;
  if (!url) throw new Error("image response had no data");
  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${img.status}`);
  return Buffer.from(await img.arrayBuffer());
}

async function main() {
  console.log("start brand-matched icons");
  const limit = Number(process.env.ICON_LIMIT || 0);
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      nameAr: true,
      nameEn: true,
      parentId: true,
      parent: {
        select: {
          name: true,
          nameAr: true,
          nameEn: true,
          parent: { select: { name: true, nameAr: true, nameEn: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  const rootsOnly = process.env.ICON_ROOTS === "1";
  const scoped = rootsOnly ? rows.filter((row) => !row.parentId) : rows;
  const batch = limit > 0 ? scoped.slice(0, limit) : scoped;
  let done = 0;
  let failed = 0;
  for (const row of batch) {
    const nameAr = row.nameAr || row.name;
    const nameEn = row.nameEn || row.name;
    try {
      const raw = await generatePng(row);
      const png = await sharp(raw).resize(512, 512, { fit: "cover" }).png().toBuffer();
      const media = await saveMedia(png, `أيقونة ${nameAr}`);
      await prisma.category.update({ where: { id: row.id }, data: { imageId: media.id } });
      done += 1;
      console.log(`ok ${done}/${batch.length} ${nameEn}`);
    } catch (err) {
      failed += 1;
      console.log(`fail ${nameEn}: ${err.message}`);
      if (failed >= 3 && done === 0) break;
    }
  }
  console.log(`DONE ok=${done} fail=${failed}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
