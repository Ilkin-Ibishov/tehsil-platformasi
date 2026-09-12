// Admin autentifikasiyası və təhlükəsizlik köməkçisi — ADR-023 / Admin Gateway
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "th_admin_session";
const DEFAULT_DEV_SECRET = "London2027@@";

/**
 * Gözlənilən admin açarını qaytarır.
 * Təhlükəsizlik Qaydası (P0):
 * Production mühitində ADMIN_SECRET_KEY mütləq env-dən gəlməlidir.
 * Default dev açarından yalnız qeyri-production mühitdə istifadə oluna bilər.
 */
export function getExpectedAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_SECRET;
  }

  // Production mühitində gizli açar env-də yoxdursa, heç bir halda default qəbul edilmir!
  console.error("[admin-auth] KRİTİK: Production mühitində ADMIN_SECRET_KEY təyin edilməyib!");
  return null;
}

/**
 * Təqdim olunan açarın doğruluğunu yoxlayır.
 */
export function isValidAdminSecret(candidateSecret?: string | null): boolean {
  if (!candidateSecret) return false;
  const expected = getExpectedAdminSecret();
  if (!expected) return false;
  return candidateSecret.trim() === expected;
}

/**
 * Server komponentləri və ya API marşrutlarında admin icazəsini yoxlayır.
 * Giriş üsulları:
 * 1. Authorization: Bearer <secret>
 * 2. x-admin-key header
 * 3. URL query parametri: ?admin_key=<secret>
 * 4. HttpOnly cookie: th_admin_session=<secret>
 */
export async function verifyAdminAuth(req?: NextRequest | Request): Promise<boolean> {
  const expected = getExpectedAdminSecret();
  if (!expected) {
    // Production-da secret təyin edilməyibsə, heç kimə icazə verilmir (fail-safe)
    return false;
  }

  if (req) {
    // 1. Authorization: Bearer <secret>
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === expected) return true;
    }

    // 2. Custom header
    const keyHeader = req.headers.get("x-admin-key");
    if (keyHeader?.trim() === expected) return true;

    // 3. Query string (Request və ya NextRequest üçün)
    try {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get("admin_key");
      if (queryKey?.trim() === expected) return true;
    } catch {
      // url parse fail -> keç
    }

    // 4. Request headers cookie
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
      if (match && decodeURIComponent(match[1].trim()) === expected) {
        return true;
      }
    }
  }

  // 5. Next.js cookies() store yoxlanışı (Server Components və Route Handlers)
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (session?.trim() === expected) return true;
  } catch {
    // cookies() konteksti yoxdursa keç
  }

  return false;
}
