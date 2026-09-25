import { existsSync } from "node:fs";
import type { Config } from "drizzle-kit";

if (existsSync(".env")) {
  try { process.loadEnvFile(".env"); } catch { /* yok sayilir */ }
}

/** Gelistirmede `npm run dev` tarafindan baslatilan gomulu sunucu. */
const DEV_URL = "postgresql://mang:mang@127.0.0.1:5433/mang";

export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL?.trim() || DEV_URL },
  verbose: true,
  strict: false,
} satisfies Config;
