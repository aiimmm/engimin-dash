// ============================================================================
// API Route — /api/permissions
// Purpose: Sinkronisasi permissions global via Upstash Redis
//          GET  → ambil permissions (semua user type, termasuk non-admin)
//          POST → simpan permissions (admin only)
// ============================================================================

import {
  DEFAULT_USER_TYPE_PERMISSIONS,
  DEFAULT_FEATURES_PER_USER_TYPE,
  USER_TYPES,
  getEffectiveUserType,
} from "@/lib/permissions";
import { getRedisClient, REDIS_PERMISSIONS_KEY } from "@/lib/redis";
import { getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

/**
 * Verifikasi apakah request berasal dari Admin (berdasarkan domain atau session).
 * @param {Request} request
 * @param {Object|null} session
 * @returns {boolean}
 */
function isAuthorizedAdmin(request, session) {
  if (!session) return false;

  // 1. Cek dari host header (misal: admin.jossjiss.ai.id atau localhost)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const effectiveType = getEffectiveUserType(host);
  if (effectiveType === USER_TYPES.ADMIN) {
    return true;
  }

  // 2. Fallback: jika session memiliki userType ADMIN eksplisit
  const userType = session.user?.userType || session.userType || "";
  if (String(userType).toUpperCase() === USER_TYPES.ADMIN) {
    return true;
  }

  return false;
}

/**
 * Merge permissions dari Redis dengan defaults supaya tidak ada key yang hilang.
 * @param {Object} stored - raw data dari Redis
 * @returns {Object}
 */
function mergeWithDefaults(stored) {
  if (!stored || typeof stored !== "object") return DEFAULT_USER_TYPE_PERMISSIONS;

  const result = {};
  for (const type of Object.values(USER_TYPES)) {
    const def = DEFAULT_USER_TYPE_PERMISSIONS[type];
    const src = stored[type] || {};
    result[type] = {
      allowedRoutes: Array.isArray(src.allowedRoutes) ? src.allowedRoutes : def.allowedRoutes,
      features: {
        ...DEFAULT_FEATURES_PER_USER_TYPE[type],
        ...(src.features && typeof src.features === "object" ? src.features : {}),
      },
    };
  }
  return result;
}

// ----------------------------------------------------------------------------
// GET /api/permissions
// Mengambil permissions terbaru dari Redis (atau default jika belum ada/error)
// ----------------------------------------------------------------------------
export async function GET() {
  const redis = getRedisClient();

  // Redis tidak terkonfigurasi → kembalikan default (mode lokal)
  if (!redis) {
    return NextResponse.json({
      permissions: DEFAULT_USER_TYPE_PERMISSIONS,
      fromRedis: false,
      message: "Redis tidak terkonfigurasi, menggunakan preset default.",
    });
  }

  try {
    const raw = await redis.get(REDIS_PERMISSIONS_KEY);

    // Belum ada data di Redis → kembalikan default
    if (!raw) {
      return NextResponse.json({
        permissions: DEFAULT_USER_TYPE_PERMISSIONS,
        fromRedis: true,
        message: "Belum ada konfigurasi tersimpan, menggunakan preset default.",
      });
    }

    const stored = typeof raw === "string" ? JSON.parse(raw) : raw;
    const permissions = mergeWithDefaults(stored);

    return NextResponse.json({ permissions, fromRedis: true });
  } catch (err) {
    console.error("[/api/permissions GET] Redis error:", err?.message);
    return NextResponse.json({
      permissions: DEFAULT_USER_TYPE_PERMISSIONS,
      fromRedis: false,
      message: "Redis error, menggunakan preset default.",
    });
  }
}

// ----------------------------------------------------------------------------
// POST /api/permissions
// Hanya ADMIN yang boleh menyimpan permissions.
// ----------------------------------------------------------------------------
export async function POST(request) {
  const session = await getSession();
  if (!isAuthorizedAdmin(request, session)) {
    return NextResponse.json(
      { message: "Hanya Administrator yang dapat mengubah permissions." },
      { status: 403 },
    );
  }

  const redis = getRedisClient();
  if (!redis) {
    return NextResponse.json(
      { message: "Redis tidak terkonfigurasi. Perubahan hanya tersimpan secara lokal." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid (bukan JSON)." }, { status: 400 });
  }

  // Validasi minimal: harus punya key ADMIN, COMPLETED, ALLOCATION
  const requiredKeys = Object.values(USER_TYPES);
  const missingKeys = requiredKeys.filter((k) => !body[k]);
  if (missingKeys.length > 0) {
    return NextResponse.json(
      { message: `Body tidak lengkap. Key yang hilang: ${missingKeys.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    // Simpan ke Redis
    await redis.set(REDIS_PERMISSIONS_KEY, JSON.stringify(body));
    return NextResponse.json({ success: true, message: "Permissions berhasil disinkronkan." });
  } catch (err) {
    console.error("[/api/permissions POST] Redis error:", err?.message);
    return NextResponse.json({ message: "Gagal menyimpan ke Redis. Coba lagi." }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// DELETE /api/permissions
// Reset permissions ke default. Admin only.
// ----------------------------------------------------------------------------
export async function DELETE(request) {
  const session = await getSession();
  if (!isAuthorizedAdmin(request, session)) {
    return NextResponse.json(
      { message: "Hanya Administrator yang dapat mereset permissions." },
      { status: 403 },
    );
  }

  const redis = getRedisClient();
  if (!redis) {
    return NextResponse.json({ message: "Redis tidak terkonfigurasi." }, { status: 503 });
  }

  try {
    await redis.del(REDIS_PERMISSIONS_KEY);
    return NextResponse.json({ success: true, message: "Permissions direset ke default." });
  } catch (err) {
    console.error("[/api/permissions DELETE] Redis error:", err?.message);
    return NextResponse.json({ message: "Gagal mereset permissions." }, { status: 500 });
  }
}
