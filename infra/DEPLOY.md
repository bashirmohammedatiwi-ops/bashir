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
| `RUN_SEED=1` | أول تشغيل فقط — ينشئ الأدمن والبيانات التجريبية |
| `MEDIA_*` | ضغط الصور قبل التخزين |

## البنية

```
Internet → Nginx (:443)
            ├── /api/*   → NestJS (Docker)
            ├── /media/* → ملفات الصور من volume (مباشرة — أسرع)
            └── /*       → لوحة التحكم (Next.js static export)
PostgreSQL + Redis (شبكة داخلية فقط — بدون منافذ عامة)
```

## لوحة التحكم على الويب

عند النشر عبر `deploy.sh` يتم بناء لوحة التحكم تلقائياً وتقديمها على:

`https://YOUR_DOMAIN/` (مثال: `/login/` و `/dashboard/`)

لإعادة البناء يدوياً:

```bash
cd infra
./scripts/build-admin-web.sh
docker compose -f docker-compose.prod.yml up -d nginx
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
cd infra
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml restart nginx
chmod +x scripts/update.sh scripts/backup.sh
./scripts/update.sh          # تحديث API بعد git pull
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
| Admin لا يتصل | حدّث `NEXT_PUBLIC_API_BASE` وأعد بناء الويب (`./scripts/build-admin-web.sh`) أو exe |
| لوحة الويب فارغة | شغّل `./scripts/build-admin-web.sh` ثم أعد تشغيل nginx |
| بطء الصور | تأكد أن الطلبات تذهب إلى `/media/` وليس عبر API |

## النسخ الاحتياطي

```bash
./scripts/backup.sh
# ينشئ infra/backups/postgres_*.sql.gz و media_*.tar.gz
```
