// ============================================================================
// API Route — /api/workorders/extend (Extend Action Date Endpoint)
// Purpose: Send bulk extend request for work orders to upstream /extendWorkOrder
// Used by: ExtendDialog component across all dashboard tables
// ============================================================================

import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import { safeError } from "@/lib/security";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { codes = [], listWo = [], start = "", end = "", notes = "-" } = body;

    const userName = session.user?.name || session.user?.username || "User";

    const payload = {
      codes,
      listWo: listWo.map(Number),
      user: userName,
      start,
      end,
      notes: notes || "-",
    };

    const response = await upstreamApi.post(
      `/extendWorkOrder?id=${encodeURIComponent(session.user.id)}`,
      payload,
      { headers: authorizationHeaders(session) },
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
