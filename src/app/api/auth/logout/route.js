// ============================================================================
// API Route — /api/auth/logout (Logout Endpoint)
// Purpose: Clear session cookie and invalidate active user session
// Used by: Global Navigation / Sidebar
// ============================================================================

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security";

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Origin is not allowed." }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
