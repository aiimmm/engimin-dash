// ============================================================================
// API Route — /api/workorders/required-wo/sync-sheet (Google Sheets Sync Endpoint)
// Purpose: Receive appointment, CI conflict, and aging rows and push to Google Sheets Webhook
// Used by: /dashboard/appointment-dates & /dashboard/conflict & /dashboard/aging & Background Sheet Sync
// ============================================================================

import { getSession } from "@/lib/auth/session";
import { safeError } from "@/lib/security";
import { syncRequiredWorkorderToGoogleSheet } from "@/lib/services";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date = "", rows = [], appointmentRows, conflictRows, agingRows } = body;

    const result = await syncRequiredWorkorderToGoogleSheet({
      rows,
      appointmentRows,
      conflictRows,
      agingRows,
      date,
    });

    return NextResponse.json({
      success: result.success,
      spreadsheetName:
        result.data?.spreadsheetName || process.env.REQUIRED_WO_SHEET_NAME || undefined,
      sheetName: result.data?.sheetName || "",
      totalRows: result.data?.totalRows || 0,
      appointmentCount: result.data?.appointmentCount || 0,
      conflictCount: result.data?.conflictCount || 0,
      agingCount: result.data?.agingCount || 0,
      configured: result.configured,
      message: result.message || undefined,
      syncedAt: result.data?.syncedAt || new Date().toISOString(),
    });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
