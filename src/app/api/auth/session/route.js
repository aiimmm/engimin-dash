// ============================================================================
// API Route — /api/auth/session (Session Checker Endpoint)
// Purpose: Return currently authenticated user profile from encrypted iron-session
// Used by: Global App Session Validator & Route Guards
// ============================================================================

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return session
    ? NextResponse.json({ user: session.user })
    : NextResponse.json({ message: "Sesi tidak valid." }, { status: 401 });
}
