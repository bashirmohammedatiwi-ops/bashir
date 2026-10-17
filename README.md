# Alhayaa

Monorepo for the Alhayaa e-commerce platform.

## Projects

| Directory | Description |
|-----------|-------------|
| `backend/` | NestJS API (PostgreSQL, Prisma) |
| `admin-desktop/` | Admin panel — web (static) + Electron desktop (Next.js) |
| `pos-sync-desktop/` | Electron POS sync (SQL Server → VPS) |
| `infra/` | Docker Compose, Nginx, deployment scripts |
| `mobile-app/` | Flutter customer app — API only (no mock data), synced with admin panel |
| `manager-app/` | Flutter manager app — barcode scan (camera / Bluetooth / typed), product & shade on/off, image crop/frame, saved-barcode groups |
| `docs/` | Project documentation |

## Quick start

See `backend/README.md`, `pos-sync-desktop/README.md`, and `infra/DEPLOY.md`.
