import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
// TODO: migrate to proxy.ts once @opennextjs/cloudflare
// supports Next.js 16 proxy/Node middleware.

const intlMiddleware = createMiddleware({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Admin: exactamente la lógica que ya tenías, sin cambios ---
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const isValid = token ? await verifySessionToken(token) : false;

    if (isLoginPage) {
      if (isValid) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!isValid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  // --- Todo lo demás: detección/redirección de locale ---
  return intlMiddleware(req);
}

export const config = {
  // Corre en todo excepto /api, /_next y archivos estáticos (con extensión).
  // /admin queda adentro a propósito: así el branch de arriba se ejecuta,
  // pero intlMiddleware nunca llega a tocarlo porque el `if` corta antes.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};