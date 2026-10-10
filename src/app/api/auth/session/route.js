// ============================================================================
// APP / API / AUTH / SESSION — Current Session Route Handler
// Purpose: Fetch current authenticated user session data safely
// ============================================================================

import { getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      name: session.name,
      username: session.username,
      email: session.email,
      isNeedChangePass: session.isNeedChangePass,
    },
  });
}
