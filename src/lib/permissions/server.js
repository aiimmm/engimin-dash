// ============================================================================
// LIB / PERMISSIONS / SERVER — Server-side Permission Verification
// Purpose: Protect API routes against unauthorized execution of restricted features
// Server-only: Jangan import di client components
// ============================================================================

import "server-only";

import {
  DEFAULT_USER_TYPE_PERMISSIONS,
  USER_TYPES,
  getEffectiveUserType,
  isFeatureAllowed,
} from "./index";
import { getRedisClient, REDIS_PERMISSIONS_KEY } from "@/lib/redis";

/**
 * Memeriksa apakah suatu fitur diizinkan secara server-side berdasarkan request host dan Redis permissions.
 * @param {Request} request - Next.js Request object
 * @param {string} featureId - "actionDatesExtend" | "actionDatesMove" | "syncGoogleSheet"
 * @returns {Promise<boolean>}
 */
export async function isFeatureAllowedServer(request, featureId) {
  if (!featureId) return true;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const userType = getEffectiveUserType(host);

  // Admin selalu memiliki akses penuh ke seluruh fitur
  if (userType === USER_TYPES.ADMIN) {
    return true;
  }

  let activePermissions = DEFAULT_USER_TYPE_PERMISSIONS;

  // Baca permissions global dari Upstash Redis jika tersedia
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(REDIS_PERMISSIONS_KEY);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object") {
          activePermissions = parsed;
        }
      }
    } catch (err) {
      console.warn(
        "[isFeatureAllowedServer] Gagal membaca Redis, menggunakan default:",
        err?.message,
      );
    }
  }

  return isFeatureAllowed(featureId, userType, activePermissions);
}
