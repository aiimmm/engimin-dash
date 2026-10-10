import { NextResponse } from "next/server";

const SESSION_COOKIE = "wo_session";

export function proxy(request) {
  const authenticated = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = request.nextUrl.pathname === "/auth/login";
  if (!authenticated && !isLogin) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if (authenticated && isLogin) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account", "/authlogin"],
};
