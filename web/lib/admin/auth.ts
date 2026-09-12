// Admin autentifikasiyası və təhlükəsizlik köməkçisi — ADR-023 / Admin Gateway
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "th_admin_session";
const DEFAULT_DEV_SECRET = "tehsil-admin-secret-2026";

export function getExpectedAdminSecret(): string {
  return process.env.ADMIN_SECRET_KEY || DEFAULT_DEV_SECRET;
}

/**
 * Server komponentləri və ya API marşrutlarında admin icazəsini yoxlayır.
 * Giriş üsulları:
 * 1. Authorization: Bearer <secret>
 * 2. Cookie: th_admin_session=<secret>
 * 3. URL param: ?admin_key=<secret> (ilk daxilolma üçün rahatlıq)
 * 4. Qeyri-production mühitdə default dev token qəbul edilir
 */
export async function verifyAdminAuth(req?: NextRequest | Request): Promise<boolean> {
  const expected = getExpectedAdminSecret();

  // 1. Authorization header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === expected) return true;
    }

    // 2. Custom header
    const keyHeader = req.headers.get("x-admin-key");
    if (keyHeader === expected) return true;

    // 3. Query string (NextRequest və ya standart Request üçün)
    try {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get("admin_key");
      if (queryKey === expected) return true;
    } catch {
      // url parse fail -> keç
    }
  }

  // 4. Cookie yoxlanışı
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (session === expected) return true;
  } catch {
    // cookies() konteksti yoxdursa keç
  }

  // Lokal dev mühitində avtomatik icazə (istifadəçi üçün friction-suz təcrübə)
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
}

export { ADMIN_COOKIE_NAME };
