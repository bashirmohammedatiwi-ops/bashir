# Catalog Hub

خدمة البحث في كتالوجات المتاجر (Nice One · Vanilla · الريان · ميرايا · وجوه) لصفحة **الاستيراد من الكتالوج** في لوحة Alhayaa.

## التشغيل مع Alhayaa (موصى به)

يُشغَّل تلقائياً عبر `infra/docker-compose.prod.yml` ويُعرَض عبر Nginx على نفس المنفذ 80:

```
http://YOUR_DOMAIN/catalog-hub/api/health
http://YOUR_DOMAIN/catalog-hub/api/import/search?q=BARCODE
```

بعد التحديث على السيرفر:

```bash
cd ~/alhayaa/infra
./scripts/update.sh
```

`update.sh` يبني `catalog-hub`، يحدّث Nginx، ويعيد بناء لوحة التحكم مع:

```env
NEXT_PUBLIC_CATALOG_HUB_URL=http://YOUR_DOMAIN/catalog-hub
```

## تشغيل مستقل (تطوير)

```bash
cd catalog-hub
PORT=10000 HOST=0.0.0.0 node server.js
```

أو:

```bash
docker compose up -d --build
```

## التحقق

```bash
curl http://127.0.0.1/catalog-hub/api/health
curl "http://127.0.0.1/catalog-hub/api/import/search?q=3337875597180"
```
