// ============================================================================
// API Route — /api/workorders (Work Orders Data Fetcher)
// Purpose: Fetch and enrich work orders for all dashboard tabs (Appointment, Created, Action, Conflict)
// Used by:
//   - /dashboard/appointment-dates (?appointment)
//   - /dashboard/created-dates (?createdToday=1)
//   - /dashboard/action-dates (?actionDates=1)
//   - /dashboard/conflict-dates (?conflictDates=1)
// ============================================================================

import {
  getRoomBookingSummary,
  getRoomWoHistory,
  mapWithConcurrency,
} from "@/lib/api/room-bookings";
import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import { safeError } from "@/lib/security";
import { createActionDatesPayload } from "@/modules/action-dates/lib";
import { createAgingPayload, defaultAgingDateRange } from "@/modules/aging/lib";
import {
  createConflictDatesPayload,
  defaultConflictDatesRange,
  isExcludedConflictArticle,
} from "@/modules/conflict-dates/lib";
import { createCreatedTodayPayload } from "@/modules/created-dates/lib";
import {
  checkHasPendingChurnWo,
  checkIsBreakContract,
  createWorkOrderPayload,
  EXTRA_DEPARTMENT_QUERIES,
  hasScheduledActionTime,
  isExcludedAppointmentDepartment,
  mergeWorkOrderRows,
  normalizeWorkOrderResponse,
  today,
  yesterday,
} from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams;
  const isAging = query.get("aging") === "1";
  const isConflictDates = query.get("conflictDates") === "1";
  const isCreatedToday = query.get("createdToday") === "1";
  const isActionDates = query.get("actionDates") === "1";
  const fetchAll = query.get("all") === "1";
  const page = Math.max(1, Number(query.get("page") || 1));
  const limit = fetchAll ? "" : Math.min(100, Math.max(5, Number(query.get("limit") || 10)));
  const baseFilters = {
    status: query.getAll("status"),
    cluster: query.get("cluster"),
    engineer: query.get("engineer"),
    dateFrom: query.get("dateFrom"),
    dateTo: query.get("dateTo"),
    sortBy: query.get("sortBy"),
    sortDirection: query.get("sortDirection"),
    offset: fetchAll ? 0 : (page - 1) * limit,
    limit,
  };

  try {
    if (isAging) {
      const dateRange = defaultAgingDateRange();
      const fromDate = query.get("dateFrom") || dateRange.from;
      const toDate = query.get("dateTo") || dateRange.to;
      const posDate = query.get("posDate") || query.get("pos_date") || today();

      const payload = createAgingPayload({
        ...baseFilters,
        dateFrom: fromDate,
        dateTo: toDate,
        posDate,
      });

      const response = await upstreamApi.post(
        `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
        payload,
        { headers: authorizationHeaders(session) },
      );

      const rawRows = normalizeWorkOrderResponse(response.data).rows;
      const rows = rawRows.filter((row) => !isExcludedConflictArticle(row.article));
      const roomIds = [
        ...new Set(
          rows
            .map((row) => row.foRoomsId)
            .filter((roomId) => roomId !== "—" && Number.isFinite(Number(roomId))),
        ),
      ];

      if (roomIds.length) {
        const summaries = await mapWithConcurrency(roomIds, 6, async (roomId) => [
          roomId,
          await getRoomBookingSummary(session, roomId).catch(() => null),
        ]);
        const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
        const enrichedRows = rows.map((row) => {
          const summary = bookingByRoom.get(row.foRoomsId);
          const active = summary?.active || null;
          const latest = summary?.latest || null;
          return {
            ...row,
            activeReservation: active,
            latestReservation: latest,
            booking: active || latest || null,
          };
        });
        return NextResponse.json({ rows: enrichedRows, total: enrichedRows.length });
      }

      return NextResponse.json({ rows, total: rows.length });
    }
    if (isConflictDates) {
      const dateRange = defaultConflictDatesRange();
      const fromDate = query.get("dateFrom") || dateRange.from;
      const toDate = query.get("dateTo") || dateRange.to;
      const posDate = query.get("posDate") || query.get("pos_date") || today();

      const payload = createConflictDatesPayload({
        ...baseFilters,
        dateFrom: fromDate,
        dateTo: toDate,
        posDate,
      });

      const response = await upstreamApi.post(
        `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
        payload,
        { headers: authorizationHeaders(session) },
      );

      const rawRows = normalizeWorkOrderResponse(response.data).rows;
      const rows = rawRows.filter((row) => !isExcludedConflictArticle(row.article));
      const roomIds = [
        ...new Set(
          rows
            .map((row) => row.foRoomsId)
            .filter((roomId) => roomId !== "—" && Number.isFinite(Number(roomId))),
        ),
      ];

      if (roomIds.length) {
        const summaries = await mapWithConcurrency(roomIds, 6, async (roomId) => [
          roomId,
          await getRoomBookingSummary(session, roomId).catch(() => null),
        ]);
        const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
        const enrichedRows = rows.map((row) => {
          const summary = bookingByRoom.get(row.foRoomsId);
          const active = summary?.active || null;
          const latest = summary?.latest || null;
          const matchedFuture = row.otaBookNumber
            ? summary?.bookingsByGenId?.[row.otaBookNumber]
            : null;
          return {
            ...row,
            activeReservation: active,
            latestReservation: latest,
            futureReservation: matchedFuture || null,
            booking: active || matchedFuture || latest || null,
          };
        });
        return NextResponse.json({ rows: enrichedRows, total: enrichedRows.length });
      }

      return NextResponse.json({ rows, total: rows.length });
    }
    if (isActionDates) {
      const fromDate = query.get("dateFrom") || yesterday();
      const toDate = query.get("dateTo") || yesterday();
      const posDate = query.get("posDate") || query.get("pos_date") || today();

      const payload = createActionDatesPayload({
        ...baseFilters,
        dateFrom: fromDate,
        dateTo: toDate,
        posDate,
      });

      const response = await upstreamApi.post(
        `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
        payload,
        { headers: authorizationHeaders(session) },
      );

      const rows = normalizeWorkOrderResponse(response.data).rows;
      const roomIds = [
        ...new Set(
          rows
            .map((row) => row.foRoomsId)
            .filter((roomId) => roomId !== "—" && Number.isFinite(Number(roomId))),
        ),
      ];

      if (!roomIds.length) {
        return NextResponse.json({ rows, total: rows.length });
      }

      // ── Parallel: booking summary + WO history (hanya room dengan breakcontract_date) ──
      const breakContractRoomIds = [
        ...new Set(
          rows
            .filter((row) => Boolean(row.breakContractDate))
            .map((row) => row.foRoomsId)
            .filter((id) => Number.isFinite(Number(id))),
        ),
      ];

      const [summaries, woHistories] = await Promise.all([
        // Booking summary untuk semua room (reservasi aktif / CI / CO)
        mapWithConcurrency(roomIds, 6, async (roomId) => [
          roomId,
          await getRoomBookingSummary(session, roomId).catch(() => null),
        ]),
        // WO history hanya untuk room yang punya breakcontract_date
        mapWithConcurrency(breakContractRoomIds, 6, async (roomId) => [
          roomId,
          await getRoomWoHistory(session, roomId).catch(() => []),
        ]),
      ]);

      const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
      // Map roomId → hasPendingChurnWo (boolean)
      const pendingChurnByRoom = new Map(
        woHistories.map(([roomId, history]) => [roomId, checkHasPendingChurnWo(history)]),
      );

      const enrichedRows = rows.map((row) => {
        const summary = bookingByRoom.get(row.foRoomsId);
        const matchedFuture = row.otaBookNumber
          ? summary?.bookingsByGenId?.[row.otaBookNumber]
          : null;
        const hasPendingChurnHistory = pendingChurnByRoom.get(row.foRoomsId) ?? false;

        return {
          ...row,
          activeReservation: summary?.active || null,
          latestReservation: summary?.latest || null,
          futureReservation: matchedFuture || null,
          booking: summary?.active || null,
          ciDate: matchedFuture?.checkinDate || row.ciDate,
          coDate: matchedFuture?.checkoutDate || row.coDate,
          hasPendingChurnHistory,
          // Recompute isBreakContract dengan info Pending Churn
          isBreakContract: checkIsBreakContract(
            row.breakContractDate,
            row.endContractDate,
            new Date(),
            hasPendingChurnHistory,
          ),
        };
      });

      return NextResponse.json({ rows: enrichedRows, total: enrichedRows.length });
    }

    if (isCreatedToday) {
      const fromDate = query.get("dateFrom") || today();
      const toDate = query.get("dateTo") || today();
      const posDate = query.get("posDate") || query.get("pos_date") || "";

      const payload = createCreatedTodayPayload({
        ...baseFilters,
        dateFrom: fromDate,
        dateTo: toDate,
        posDate,
      });

      const response = await upstreamApi.post(
        `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
        payload,
        { headers: authorizationHeaders(session) },
      );

      const rows = normalizeWorkOrderResponse(response.data).rows;
      const roomIds = [
        ...new Set(
          rows
            .map((row) => row.foRoomsId)
            .filter((roomId) => roomId !== "—" && Number.isFinite(Number(roomId))),
        ),
      ];

      if (roomIds.length) {
        const summaries = await mapWithConcurrency(roomIds, 6, async (roomId) => [
          roomId,
          await getRoomBookingSummary(session, roomId).catch(() => null),
        ]);
        const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
        const enrichedRows = rows.map((row) => ({
          ...row,
          activeReservation: bookingByRoom.get(row.foRoomsId)?.active || null,
          latestReservation: bookingByRoom.get(row.foRoomsId)?.latest || null,
          booking: bookingByRoom.get(row.foRoomsId)?.active || null,
        }));
        return NextResponse.json({ rows: enrichedRows, total: enrichedRows.length });
      }

      return NextResponse.json({ rows, total: rows.length });
    }

    // Fetch "engineering" plus extra department_in_charge values (e.g. "-", "Unassigned").
    const [engineeringResponse, ...extraResponses] = await Promise.all(
      ["engineering", ...EXTRA_DEPARTMENT_QUERIES].map((department) =>
        upstreamApi.post(
          `/listWONewSedangDiRefactor?id=${encodeURIComponent(session.user.id)}`,
          createWorkOrderPayload({ ...baseFilters, department }),
          { headers: authorizationHeaders(session) },
        ),
      ),
    );

    const engineeringRows = normalizeWorkOrderResponse(engineeringResponse.data).rows;
    const extraRowSets = extraResponses.map(
      (response) => normalizeWorkOrderResponse(response.data).rows,
    );
    const allRows = mergeWorkOrderRows(engineeringRows, extraRowSets);
    const scheduledRows = allRows
      .filter((row) => hasScheduledActionTime(row.actionDate))
      .filter((row) => !isExcludedAppointmentDepartment(row.department));
    const roomIds = [
      ...new Set(
        scheduledRows
          .map((row) => row.foRoomsId)
          .filter((roomId) => roomId !== "—" && Number.isFinite(Number(roomId))),
      ),
    ];
    const summaries = await mapWithConcurrency(roomIds, 6, async (roomId) => [
      roomId,
      await getRoomBookingSummary(session, roomId),
    ]);
    const bookingByRoom = new Map(summaries);
    const rows = scheduledRows
      .map((row) => {
        const summary = bookingByRoom.get(row.foRoomsId);
        const latest = summary?.latest || summary?.active || null;
        const booking = latest;

        const formattedCheckinDate = booking?.formattedCheckinDate || null;
        const formattedCheckoutDate = booking?.formattedCheckoutDate || null;

        return {
          ...row,
          activeReservation: summary?.active || null,
          latestReservation: latest,
          booking: booking
            ? {
                ...booking,
                formattedCheckinDate,
                formattedCheckoutDate,
              }
            : null,
          formattedCheckinDate,
          formattedCheckoutDate,
          ciDate: formattedCheckinDate,
          coDate: formattedCheckoutDate,
        };
      })
      .filter((row) => {
        if (!row.formattedCheckoutDate || !row.actionDate) return true;
        const coStr = String(row.formattedCheckoutDate).replace(/-/g, "").trim();
        const actionMatch = String(row.actionDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
        const actionStr = actionMatch
          ? `${actionMatch[1]}${actionMatch[2]}${actionMatch[3]}`
          : null;
        if (coStr && actionStr && coStr <= actionStr) {
          return false;
        }
        return true;
      });

    return NextResponse.json({ rows, total: rows.length });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
