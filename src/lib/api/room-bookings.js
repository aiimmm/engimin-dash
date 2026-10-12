// ============================================================================
// LIB / API — Upstream Room Booking Details & Cache Service
// Purpose: Fetch and cache active & latest reservation details for FO rooms
// Description: Queries upstream /getDataBookingForWo with concurrency throttle and TTL cache
// ============================================================================

import "server-only";

import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import {
  jakartaTodayNumber,
  normalizeActiveReservation,
  normalizeLatestReservation,
} from "@/modules/shared/work-orders/lib";

const CACHE_TTL_MS = 3 * 60 * 1000;
const bookingCache = new Map();

export async function getRoomBookingSummary(session, roomId) {
  const userId = session?.user?.id || "";
  const cacheKey = `${userId}:${roomId}:${jakartaTodayNumber()}`;
  const cached = bookingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { data } = await upstreamApi.post(
    `/getDataBookingForWo?id=${encodeURIComponent(userId)}`,
    { fo_rooms_id: Number(roomId) },
    { headers: authorizationHeaders(session) },
  );
  if (!data?.success) {
    throw Object.assign(
      new Error(data?.message || `Failed to fetch booking data for FO Room ${roomId}.`),
      { status: 502 },
    );
  }

  const bookingList = Array.isArray(data?.data) ? data.data : [];
  const bookingsByGenId = {};
  bookingList.forEach((b) => {
    const genIdKey = String(b.genId || b.otaBookNumber || b.ota_book_number || "").trim();
    if (genIdKey) {
      bookingsByGenId[genIdKey] = {
        genId: genIdKey,
        checkinDate: b.formattedCheckinDate || b.checkinDate || b.ci_date,
        checkoutDate: b.formattedCheckoutDate || b.checkoutDate || b.co_date,
        guestName: b.guestName || "",
        contactPhone: b.contactPhone || "",
      };
    }
  });

  const value = {
    latest: normalizeLatestReservation(data),
    active: normalizeActiveReservation(data),
    bookingsByGenId,
    count: Number(data.count || bookingList.length || 0),
  };
  bookingCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
