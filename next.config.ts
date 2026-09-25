import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Docker imaji icin minimal cikti (yalnizca gerekli node_modules kopyalanir)
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg", "web-push", "exceljs", "nodemailer"],
  /**
   * Migration'lar dagitim sirasinda ayri bir surecte calisir
   * (scripts/migrate-prod.mjs). Bu dosyalar uygulama kodundan referans
   * verilmedigi icin Next'in izleyicisi onlari imaja dahil etmez; burada
   * acikca ekliyoruz. Aksi halde dagitimdaki migration adimi coker.
   */
  outputFileTracingIncludes: {
    /*
      nodemailer yalnizca `await import()` ile, SMTP_URL tanimliysa yuklenir.
      Next'in izleyicisi bu kosullu kullanimi standalone ciktisina almiyordu:
      paket uretim imajinda hic bulunmuyor, SMTP dogru girilse bile e-posta
      sessizce gitmiyordu. drizzle-orm ile ayni sekilde acikca ekleniyor.
    */
    "/api/auth/forgot-password": ["./node_modules/nodemailer/**"],
    "/api/platform/users/[id]/reset-link": ["./node_modules/nodemailer/**"],
    "/api/health": [
      // Paketin tamami: ESM altyol cozumlemesi package.json "exports"
      // haritasina bagli oldugu icin parcali kopyalama yeterli olmuyor.
      "./node_modules/drizzle-orm/**",
      "./drizzle/**",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      // Servis calisani icin acikca gerekli: `default-src`/`script-src`'e
      // dususe guvenmek tarayicilar arasinda tutarsiz, kayit reddedilebiliyor.
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      /*
        'self': QR menu tasarim ekrani, gercek /qr-menu/preview sayfasini
        iframe'de gosterir (canli onizleme). Baska siteler yine cerceveye
        alamaz (clickjacking korumasi surer).
      */
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
