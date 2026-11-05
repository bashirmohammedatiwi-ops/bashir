// تجهيز منتجات جديدة للتصاميم: تنزيل الصورة ← قص الهوامش ← قص بشفافية.
// usage: node prep.js <id> [id...] [--rect=id,id] [--hull=id,id] [--force]
//   --rect  علبة واحدة بمواجهة الكاميرا (مستطيل كامل)
//   --hull  أنبوب/عبوة محدّبة بيضاء تأكل خلفيتها البيضاء أجزاءً منها
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { byId } = require('./kit');

const BF = path.join(__dirname, '..', 'bf');
const PW = path.join(__dirname, '..', 'pw');
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const ids = args.filter((a) => !a.startsWith('--'));
// مجلدات مؤقتة خاصة بكل تشغيل (تُنشأ بعد أخذ القفل)
const tmp = path.join(BF, 'prod_new_' + process.pid);
const cutNew = path.join(BF, 'cut_new_' + process.pid);

// قفل: عدة وكلاء قد يشغّلونه معاً، وملفات meta.json مشتركة
const LOCK = path.join(BF, '.prep-lock');
async function lock() {
  for (let i = 0; i < 600; i++) {
    try { fs.mkdirSync(LOCK); return; } catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
  throw new Error('prep lock timeout');
}

(async () => {
  await lock();
  try {
    await prepAll();
  } finally {
    fs.rmSync(LOCK, { recursive: true, force: true });
  }
})();

async function prepAll() {
  fs.mkdirSync(tmp, { recursive: true });
  for (const id of ids) {
    const p = byId[id];
    if (!p?.img) { console.log('skip (no image in catalog)', id); continue; }
    // روابط قديمة بعنوان IP السيرفر: نفس الملف على النطاق
    const src = p.img.replace(/^https?:\/\/[^/]+(\/media\/.*)$/, 'https://deemaalhayat.com$1');
    try {
      const r = await fetch(src);
      if (!r.ok) { console.log('download failed', id, r.status); continue; }
      fs.writeFileSync(path.join(tmp, id + '.img'), Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.log('download failed', id, e.message);
    }
  }
  execFileSync('node', [path.join(PW, 'trim.js'), tmp, cutNew], { stdio: 'inherit', cwd: PW });
  // دمج القص الأبيض مع مجلد cut الرئيسي (بطاقات التطبيق تستخدمه)
  const cutMeta = JSON.parse(fs.readFileSync(path.join(BF, 'cut', 'meta.json'), 'utf8'));
  const newMeta = JSON.parse(fs.readFileSync(path.join(cutNew, 'meta.json'), 'utf8'));
  for (const id of Object.keys(newMeta)) {
    fs.copyFileSync(path.join(cutNew, id + '.png'), path.join(BF, 'cut', id + '.png'));
    cutMeta[id] = newMeta[id];
  }
  fs.writeFileSync(path.join(BF, 'cut', 'meta.json'), JSON.stringify(cutMeta, null, 1));
  execFileSync('node', [path.join(PW, 'cutout.js'), path.join(BF, 'cut'), path.join(BF, 'alpha'), ids.join(','), ...flags], { stdio: 'inherit', cwd: PW });
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(cutNew, { recursive: true, force: true });
}
