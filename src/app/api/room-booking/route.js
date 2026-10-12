// ============================================================================
// API Route — /api/room-booking (Room Booking Details Endpoint)
// Purpose: Fetch and normalize active/latest reservation info for a given fo_rooms_id
// Used by: Work Orders Data Tables & Reservation Cell Tooltips
// ============================================================================

import { getRoomBookingSummary } from "@/lib/api/room-bookings";
import { getSession } from "@/lib/auth/session";
import { isSameOrigin, safeError } from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  fo_rooms_id: z.coerce.number().int().positive(),
});

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Session has expired." }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "FO Rooms ID is not valid." }, { status: 400 });
  }

  try {
    const summary = await getRoomBookingSummary(session, parsed.data.fo_rooms_id);
    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    const safe = safeError(error, "Failed to fetch room booking summary.");
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
