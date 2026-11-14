// ============================================================================
// LIB / REDIS — Upstash Redis Client
// Purpose: Shared Redis client instance untuk sinkronisasi permissions lintas domain
// Server-only: Jangan import di client components
// ============================================================================

import { Redis } from "@upstash/redis";

/** Singleton Redis client — null jika env vars tidak terkonfigurasi */
let _redis = null;

/**
 * Mengembalikan Redis client jika UPSTASH_REDIS_REST_URL dan
 * UPSTASH_REDIS_REST_TOKEN tersedia, atau null jika tidak.
 * @returns {import("@upstash/redis").Redis|null}
 */
export function getRedisClient() {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    _redis = new Redis({ url, token });
    return _redis;
  } catch (err) {
    console.warn("[Redis] Gagal membuat client:", err?.message);
    return null;
  }
}

/** Redis key untuk menyimpan permissions global */
export const REDIS_PERMISSIONS_KEY = "engimin:permissions";
