// ============================================================================
// API Route — /api/workorders/[id] (Work Order Details Endpoint)
// Purpose: Fetch detail of a single work order by ID or WO Number
// Used by: Work Order Detail Modal / Inspectors
// ============================================================================

import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import { safeError } from "@/lib/security";
import {
  createWorkOrderPayload,
  EXTRA_DEPARTMENT_QUERIES,
  mergeWorkOrderRows,
  normalizeWorkOrderResponse,
} from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Sesi berakhir." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const responses = await Promise.all(
      ["engineering", ...EXTRA_DEPARTMENT_QUERIES].map((department) =>
        upstreamApi.post(
          `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
          createWorkOrderPayload({ limit: 100, department }),
          { headers: authorizationHeaders(session) },
        ),
      ),
    );
    const engineeringRows = normalizeWorkOrderResponse(responses[0].data).rows;
    const extraRowSets = responses.slice(1).map((res) => normalizeWorkOrderResponse(res.data).rows);
    const allRows = mergeWorkOrderRows(engineeringRows, extraRowSets);
    const workOrder = allRows.find((row) => row.id === id || row.woNumber === id);
    return workOrder
      ? NextResponse.json(workOrder)
      : NextResponse.json({ message: "Work order tidak ditemukan." }, { status: 404 });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
