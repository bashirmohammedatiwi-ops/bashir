# Alhayaa Admin Desktop

Electron + Next.js (App Router) + Ant Design + TanStack Query.

## Dev

```bash
npm install --legacy-peer-deps
npm run dev      # runs Next on :3001 and Electron pointing to it
```

If you only want the web UI without Electron:

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

## Production exe (VPS)

After deploying the backend (see `../infra/DEPLOY.md`):

```bash
cp .env.production.example .env.production
# Edit: NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api/v1
npm run dist
```

Installer output: `release/Alhayaa-Admin-Setup-*.exe`
