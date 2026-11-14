// ============================================================================
// API Route — /api/workorders/move (Move Work Order Tracing Endpoint)
// Purpose: Send bulk update tracing requests to upstream /updateTracing
// Used by: MoveDialog component across all dashboard tables
// ============================================================================

import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import { isFeatureAllowedServer } from "@/lib/permissions/server";
import { safeError } from "@/lib/security";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const allowed = await isFeatureAllowedServer(request, "actionDatesMove");
  if (!allowed) {
    return NextResponse.json(
      { message: "Akses ditolak: Fitur Move dinonaktifkan oleh Administrator." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "No items provided for updateTracing." },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      items.map(async (item) => {
        const payload = {
          roomid: Number(item.roomid || item.foRoomsId),
          roomnumber: String(item.roomnumber || item.oldRoomName || ""),
          guestname: String(item.guestname || ""),
          workorders_id: Number(item.workorders_id || item.id),
          action_date: String(item.action_date || ""),
          id: Number(item.id || item.tracingId),
          is_wo_priority: String(item.is_wo_priority ?? "0"),
          is_guestAppointment: String(item.is_guestAppointment ?? "no"),
        };

        const res = await upstreamApi.post(
          `/updateTracing?id=${encodeURIComponent(session.user.id)}`,
          payload,
          { headers: authorizationHeaders(session) },
        );
        return res.data;
      }),
    );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
