# Alhayaa Admin Panel

Electron desktop app + static web panel (Next.js App Router, Ant Design, TanStack Query).

## Dev

```bash
npm install --legacy-peer-deps
npm run dev          # Next on :3001 + Electron desktop shell
```

### Web only (no Electron)

```bash
npm run dev:next
# open http://localhost:3001
```

## Pages

- Dashboard
- Products / Categories / Brands
- Orders
- Packages / Banners / Coupons
- Home Blocks composer
- Media library (image upload)
- Settings

All requests target the NestJS backend (`NEXT_PUBLIC_API_BASE`, default `http://localhost:3000/api/v1`).

## Production — Web

After deploying the backend (see `../infra/DEPLOY.md`), the deploy script builds and serves the admin panel at your domain root (`https://YOUR_DOMAIN/`).

Manual build:

```bash
cp .env.production.example .env.production
# Edit:
#   NEXT_PUBLIC_API_BASE=https://YOUR_DOMAIN/api/v1
#   NEXT_PUBLIC_MEDIA_BASE=https://YOUR_DOMAIN/media
npm run build:web
npm run preview:web   # local preview of out/ on :3001
```

Or from `infra/`:

```bash
./scripts/build-admin-web.sh
```

Static files are copied to `infra/admin-static/` and served by Nginx alongside `/api/` and `/media/`.

## Production — Desktop exe

Same env as web; then package for Windows:

```bash
npm run dist
```

Installer output: `release/Alhayaa-Admin-Setup-*.exe`

Desktop and web share the same `build:web` output (`out/`). Electron wraps `out/` for the desktop installer.
