import { Pool } from "pg";

// DATABASE_URL — S1a-da lokal Postgres, S1b-də Supabase-in Postgres bağlantı sətri.
// Kod dəyişmir, yalnız env dəyəri dəyişir (docs/PHASE-1.md → S1b).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL tapılmadı — .env.local-a əlavə et (bax .env.example).");
}

declare global {
  var __pgPool: Pool | undefined;
}

// Next.js dev-də modul hot-reload olunduğu üçün qlobalda saxlanılır ki hər dəfə yeni pool açılmasın.
export const pool =
  global.__pgPool ??
  new Pool({
    connectionString,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}
