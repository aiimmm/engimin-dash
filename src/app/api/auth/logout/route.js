// ============================================================================
// APP / API / AUTH / LOGOUT — Logout Route Handler
// Purpose: Destroy user session cookie securely
// ============================================================================

import { SESSION_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true, message: "Berhasil keluar dari sistem." });
}
