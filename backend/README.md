# Alhayaa Backend

NestJS (Fastify) + Prisma + PostgreSQL + Redis + BullMQ + Sharp image pipeline.

## Quick start (dev)

```bash
# 1. Postgres (+ optional Redis)
docker compose -f ../infra/docker-compose.yml up -d postgres redis

# 2. Install deps
npm install --legacy-peer-deps

# 3. Apply migrations
npm run prisma:generate
npm run prisma:deploy

# 4. Seed (admin user + demo data)
npm run seed

# 5. Start dev server
npm run dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Default admin: `admin@alhayaa.com` / `Admin@12345`

## Production (single VPS)

See **[../infra/DEPLOY.md](../infra/DEPLOY.md)** for full steps.

```bash
cd ../infra
cp .env.example .env   # edit DOMAIN + secrets
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Stack: **PostgreSQL + Redis + API + Nginx + HTTPS + media on same VPS**.

After deploy, set `admin-desktop/.env.production` and rebuild the admin exe.

## Image pipeline

On upload, images are **compressed before storage**:

1. Resize max dimension (`MEDIA_MAX_ORIGINAL_WIDTH`, default 1920px)
2. Save **WebP** (primary) + **JPEG** (fallback) on disk
3. BullMQ worker generates `thumb/small/medium/large` variants
4. Nginx serves `/media/*` directly with long cache (bypasses Node)

| Env | Default | Purpose |
|-----|---------|---------|
| `MEDIA_MAX_ORIGINAL_WIDTH` | 1920 | Max stored dimension |
| `MEDIA_WEBP_QUALITY` | 80 | WebP quality |
| `MEDIA_JPEG_QUALITY` | 82 | JPEG quality |

## Health

- `GET /api/v1/health` — liveness
- `GET /api/v1/health/ready` — DB + Redis readiness

## Local full stack (Docker)

Test production-like setup on port **8080**:

```bash
cd ../infra
docker compose up -d --build
# API + media: http://localhost:8080/api/v1
```
