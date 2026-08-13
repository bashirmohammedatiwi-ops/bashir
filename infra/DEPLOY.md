# نشر Alhayaa على VPS واحد

الباك اند + PostgreSQL + Redis + الصور + Nginx + HTTPS على **نفس السيرفر**.

## المتطلبات على VPS

- Ubuntu 22.04+ (أو أي Linux مع Docker)
- Docker Engine + Docker Compose v2
- دومين يشير إلى IP السيرفر (A record)
- فتح المنافذ **80** و **443**

## خطوات النشر

```bash
# على VPS
git clone <repo> alhayaa && cd alhayaa/infra
cp .env.example .env
nano .env   # عدّل DOMAIN وكلمات المرور
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### متغيرات `.env` المهمة

| المتغير | الوصف |
|---------|--------|
| `DOMAIN` | دومين API مثل `api.alhayaa.com` |
| `CERTBOT_EMAIL` | بريد Let's Encrypt |
| `POSTGRES_PASSWORD` | كلمة مرور PostgreSQL |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | أسرار عشوائية طويلة |
| `RUN_SEED=1` | أول تشغيل فقط — ينشئ/يحدّث حساب الأدمن (بدون بيانات تجريبية) |
| `SEED_DEMO=1` | اختياري للتطوير فقط — يضيف براندات/منتجات تجريبية (لا تستخدمه على الإنتاج) |
| `MEDIA_*` | ضغط الصور قبل التخزين |

## البنية

```
Internet → Nginx (:443)
            ├── /api/*   → NestJS (Docker)
            ├── /media/* → ملفات الصور من volume (مباشرة — أسرع)
            └── /*       → لوحة التحكم (Next.js static export)
PostgreSQL + Redis (شبكة داخلية فقط — بدون منافذ عامة)
```

## التحديث السريع (أمر واحد)

من جذر المشروع على VPS:

```bash
cd ~/alhayaa
bash pull.sh
```

هذا الأمر يقوم تلقائياً بـ:
1. **مزامنة GitHub** (`git fetch` + `reset --hard origin/main`) — بدون تعارضات `git pull`
2. **إعادة بناء ذكية** — يعيد بناء API أو لوحة التحكم أو المتجر فقط إذا تغيّر كودها
3. **بناء لوحة التحكم** تلقائياً (لا حاجة لـ `build-admin-web.sh` منفصل)
4. **Migrations** + **Nginx** + **تحقق** + **تنظيف Docker**

### خيارات إضافية

```bash
bash pull.sh --full       # إعادة بناء كل شيء (API + admin + store)
bash pull.sh --api-only   # API فقط — بدون لوحة التحكم
bash pull.sh --help
```

### إذا فشل التحديث

```bash
cd ~/alhayaa/infra
./scripts/recover-deploy.sh
```

> **ملاحظة:** `infra/.env` محفوظ (gitignored) — لن يُمسح عند `reset --hard`.

## لوحة التحكم على الويب

عند النشر عبر `deploy.sh` أو `pull.sh` يتم بناء لوحة التحكم تلقائياً وتقديمها على:

`https://YOUR_DOMAIN/admin/login/`

لإعادة البناء يدوياً (نادراً):

```bash
cd infra
./scripts/build-admin-web.sh
docker compose -f docker-compose.prod.yml up -d --force-recreate nginx
```

للتطوير المحلي بدون Electron:

```bash
cd admin-desktop
npm run dev:next
# http://localhost:3001
```

## ضغط الصور

عند الرفع يتم تلقائياً:

1. تصغير أكبر ضلع إلى `MEDIA_MAX_ORIGINAL_WIDTH` (افتراضي 1920px)
2. حفظ **WebP** (أساسي) + **JPEG** (fallback)
3. إنشاء variants (thumb/small/medium/large) عبر Redis queue
4. Nginx يخدم `/media/` مباشرة مع cache سنة كاملة

## بعد النشر

1. تحقق: `https://YOUR_DOMAIN/api/v1/health`
2. لوحة التحكم على الويب: `https://YOUR_DOMAIN/`
3. (اختياري) تطبيق سطح المكتب — عدّل `admin-desktop/.env.production` ثم `npm run dist`

## أوامر مفيدة

```bash
cd ~/alhayaa && bash pull.sh          # التحديث الموصى به — أمر واحد
cd infra && ./scripts/update.sh      # نفس pull.sh من مجلد infra
./scripts/update.sh --full           # إعادة بناء كاملة
./scripts/verify.sh                  # تحقق بعد التحديث
./scripts/recover-deploy.sh          # إصلاح git + تحديث كامل
./scripts/sync-postgres-password.sh  # إصلاح P1000 إذا تغيّرت كلمة سر DB
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml restart nginx
./scripts/backup.sh          # نسخ Postgres + الصور
```

## تطوير محلي مع PostgreSQL

```bash
cd infra && docker compose up -d postgres redis
cd ../backend
cp .env.example .env
npm run prisma:deploy
npm run seed
npm run dev
```

## إعداد من Windows (قبل الرفع على VPS)

```powershell
cd infra
Copy-Item .env.example .env
# عدّل DOMAIN والأسرار، أو:
.\scripts\deploy.ps1 -GenerateSecrets
.\scripts\deploy.ps1 -Bootstrap
```

ثم ارفع المشروع على VPS وشغّل `./scripts/deploy.sh`.

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Nginx لا يبدأ بعد SSL | تأكد أن `DOMAIN` في `.env` يطابق DNS وأن certbot نجح |
| `migration failed` | `docker compose -f docker-compose.prod.yml logs api` |
| الصور لا تظهر | تحقق من `MEDIA_PUBLIC_BASE_URL=https://DOMAIN/media` |
| Admin لا يتصل / 403 | `cd ~/alhayaa && bash pull.sh` — يصلح الصلاحيات ويعيد بناء اللوحة وnginx تلقائياً |
| `git pull` يفشل | استخدم `bash pull.sh` بدلاً منه — يعمل `reset --hard` بأمان |
| لوحة الويب فارغة أو 403 | `bash pull.sh` أو `cd infra && ./scripts/recover-deploy.sh` |
| بطء الصور | تأكد أن الطلبات تذهب إلى `/media/` وليس عبر API |

## النسخ الاحتياطي

```bash
./scripts/backup.sh
# ينشئ infra/backups/postgres_*.sql.gz و media_*.tar.gz
```
