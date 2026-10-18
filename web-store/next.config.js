/** @type {import('next').NextConfig} */
const API_DEV = process.env.API_DEV_ORIGIN || "http://localhost:3100";

const nextConfig = {
  reactStrictMode: true,
  // خادم Node مستقل داخل Docker (صفحات تُرسم على السيرفر للسرعة وجوجل ومعاينة الروابط).
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: { unoptimized: true },
  async rewrites() {
    // التطوير المحلي فقط: /api يذهب للـ API المحلي. في الإنتاج nginx يوجّه /api مباشرة.
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/api/:path*", destination: `${API_DEV}/api/:path*` }];
  },
  async redirects() {
    // روابط المتجر القديم والتطبيق (?slug=) ← المسارات الجديدة.
    return [
      { source: "/products/", destination: "/products", permanent: true },
      // روابط حملات التطبيق (نفس مسارات deep links) ← صفحات الويب.
      { source: "/orders", destination: "/account/orders", permanent: false },
      { source: "/orders/:id", destination: "/account/orders/:id", permanent: false },
      { source: "/notifications", destination: "/account/notifications", permanent: false },
      { source: "/loyalty", destination: "/account/points", permanent: false },
      { source: "/categories-tab", destination: "/categories", permanent: false },
      { source: "/advisor", destination: "/search", permanent: false },
      { source: "/register", destination: "/signup", permanent: false },
    ];
  },
};

module.exports = nextConfig;
