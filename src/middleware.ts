import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Never gate API routes — health checks, auth callbacks, etc.
  if (pathname.startsWith("/api/")) {
    return;
  }

  // Public assets in /public must stay reachable before sign-in (e.g. login logo).
  if (pathname === "/manifest.webmanifest") {
    return;
  }
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) {
    return;
  }

  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl);
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }
    return Response.redirect(loginUrl);
  }
  if (isLoggedIn && isLoginPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      return Response.redirect(new URL(callbackUrl, req.nextUrl));
    }
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
