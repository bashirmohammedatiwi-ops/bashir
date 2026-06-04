# Alhayaa — تطبيق العملاء (Flutter)

مربوط بـ **VPS Backend** ولوحة التحكم (`admin-desktop`) — نفس العنوان:

- API: `http://187.127.88.146/api/v1`
- Media: `http://187.127.88.146/media`

## تشغيل ضد VPS (افتراضي)

```powershell
cd mobile-app
flutter pub get
flutter run -d chrome
```

لا حاجة لـ `--dart-define` — التطبيق يتصل بالـ VPS مباشرة.

## تطوير محلي (backend على الجهاز)

```powershell
# Terminal 1
cd backend
npm run start:dev

# Terminal 2
cd mobile-app
flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1
```

## Android Emulator

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

## التحقق من VPS

```powershell
curl http://187.127.88.146/api/v1/health
curl http://187.127.88.146/api/v1/home
```

ملاحظة: الـ VPS يستخدم **HTTP** على IP (ليس HTTPS). لوحة التحكم تستخدم نفس الإعداد.

## Endpoints

| الميزة | Endpoint |
|--------|----------|
| الصحة | `GET /health` |
| الرئيسية | `GET /home` |
| المنتجات | `GET /products` |
| المصادقة | `/auth/*` |
| الطلبات | `POST /orders`, `GET /orders` |
