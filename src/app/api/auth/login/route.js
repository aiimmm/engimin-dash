// ============================================================================
// APP / API / AUTH / LOGIN — Server-Side Auth Proxy Route Handler
// Purpose: Secure authentication proxy for https://liohd.travelio.com/v1/api/login
// Security: Same-origin check, input validation, server-side fetch, password stripping, encrypted HttpOnly cookie session
// ============================================================================

import { serverConfig } from "@/lib/config";
import { encryptSession, sessionCookie, SESSION_MAX_AGE } from "@/lib/auth/session";
import { isSameOrigin, safeError } from "@/lib/security";
import { loginSchema } from "@/modules/auth/schemas/login.schema";
import { parseAuthResponse } from "@/modules/auth/utils/auth-response";
import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Verify Same-Origin to prevent CSRF attacks
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: permintaan harus berasal dari domain resmi." },
        { status: 403 },
      );
    }

    // 2. Parse and validate payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Payload JSON tidak valid." },
        { status: 400 },
      );
    }

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Input tidak valid.";
      return NextResponse.json({ success: false, message: firstError }, { status: 400 });
    }

    const { username, password } = validation.data;

    // 3. Make server-to-server request to target backend API
    const targetUrl = `${serverConfig.apiUrl}/login`;

    let apiResponse;
    try {
      apiResponse = await axios.post(
        targetUrl,
        { username, password },
        {
          timeout: serverConfig.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
    } catch (axiosError) {
      if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
        return NextResponse.json(
          { success: false, message: "Permintaan ke server login waktu habis. Silakan coba lagi." },
          { status: 504 },
        );
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        if (status === 401) {
          return NextResponse.json(
            { success: false, message: "Username atau password salah." },
            { status: 401 },
          );
        }

        const msg = data?.message || "Gagal melakukan autentikasi dengan server.";
        return NextResponse.json({ success: false, message: msg }, { status });
      }

      return NextResponse.json(
        { success: false, message: "Server autentikasi tidak dapat dijangkau." },
        { status: 503 },
      );
    }

    // 4. Validate and parse backend response structure safely
    const parsed = parseAuthResponse(apiResponse.data);

    // 5. Build encrypted session payload (WITHOUT passwords or hashes)
    const sessionPayload = {
      userId: parsed.user._id,
      name: parsed.user.name,
      username: parsed.user.usr,
      email: parsed.user.email,
      isNeedChangePass: parsed.isNeedChangePass,
      encryptedUserData: parsed.encryptedUserData,
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    };

    const encryptedToken = encryptSession(sessionPayload);
    const cookieOptions = sessionCookie(encryptedToken);

    // 6. Set HttpOnly cookie and return sanitized user data to client
    const response = NextResponse.json(
      {
        success: true,
        user: parsed.user,
        isNeedChangePass: parsed.isNeedChangePass,
      },
      { status: 200 },
    );

    const cookieStore = await cookies();
    cookieStore.set(cookieOptions);

    return response;
  } catch (err) {
    const errorDetails = safeError(err);
    return NextResponse.json(
      { success: false, message: errorDetails.message },
      { status: errorDetails.status },
    );
  }
}
