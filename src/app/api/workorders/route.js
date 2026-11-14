// ============================================================================
// API Route — /api/workorders (Work Orders Data Fetcher)
// Purpose: Fetch and enrich work orders for all dashboard tabs (Appointment, Created, Action, Conflict)
// Used by:
//   - /dashboard/appointment-dates (?appointment)
//   - /dashboard/created-dates (?createdToday=1)
//   - /dashboard/action-dates (?actionDates=1)
//   - /dashboard/conflict (?conflict=1)
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
  createConflictPayload,
  defaultConflictRange,
  isExcludedConflictArticle,
} from "@/modules/conflict/lib";
import { createCreatedTodayPayload } from "@/modules/created-dates/lib";
import {
  checkHasPendingChurnWo,
  checkIsBreakContract,
  createWorkOrderPayload,
  evaluatePendingChurnHistory,
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
  const isConflict = query.get("conflict") === "1";
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
        const breakContractRoomIds = [
          ...new Set(
            rows
              .filter((row) => Boolean(row.breakContractDate))
              .map((row) => row.foRoomsId)
              .filter((id) => Number.isFinite(Number(id))),
          ),
        ];

        const [summaries, woHistories] = await Promise.all([
          mapWithConcurrency(roomIds, 6, async (roomId) => [
            roomId,
            await getRoomBookingSummary(session, roomId).catch(() => null),
          ]),
          mapWithConcurrency(breakContractRoomIds, 6, async (roomId) => [
            roomId,
            await getRoomWoHistory(session, roomId).catch(() => []),
          ]),
        ]);

        const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
        const churnInfoByRoom = new Map(
          woHistories.map(([roomId, history]) => [roomId, evaluatePendingChurnHistory(history)]),
        );

        const enrichedRows = rows.map((row) => {
          const summary = bookingByRoom.get(row.foRoomsId);
          // Gunakan futureBookNumber (strict dari ota_book_number) bukan otaBookNumber
          // yang bisa fallback ke co_ota_book_number (booking current guest).
          const matchedFuture = row.futureBookNumber
            ? summary?.bookingsByGenId?.[row.futureBookNumber]
            : null;
          const churnInfo = churnInfoByRoom.get(row.foRoomsId) || {
            hasActivePendingChurn: false,
            hasCancelledPendingChurn: false,
          };
          const hasPendingChurnHistory = churnInfo.hasActivePendingChurn;
          const isPendingChurnCancelled = churnInfo.hasCancelledPendingChurn;

          // Jika WO ini future reservation (punya futureBookNumber) tapi booking tidak
          // ditemukan di getDataBookingForWo (kosong atau hanya berisi current guest),
          // maka co_date dari WO response tidak dipakai — CO date future belum diketahui.
          const resolvedCoDate =
            row.futureBookNumber && !matchedFuture
              ? null
              : matchedFuture?.checkoutDate || row.coDate;

          return {
            ...row,
            activeReservation: summary?.active || null,
            latestReservation: summary?.latest || null,
            futureReservation: matchedFuture || null,
            booking: summary?.active || null,
            ciDate: matchedFuture?.checkinDate || row.ciDate,
            coDate: resolvedCoDate,
            hasPendingChurnHistory,
            isPendingChurnCancelled,
            // Recompute isBreakContract dengan info Pending Churn & status unit
            isBreakContract: checkIsBreakContract(
              row.breakContractDate,
              row.endContractDate,
              new Date(),
              hasPendingChurnHistory,
              {
                propertyStatus: row.propertyStatus || row.property_status,
                hotelStatus: row.hotelStatus || row.hotel_status,
                isPendingChurnCancelled,
              },
            ),
          };
        });
        return NextResponse.json({ rows: enrichedRows, total: enrichedRows.length });
      }

      return NextResponse.json({ rows, total: rows.length });
    }
    if (isConflict) {
      const dateRange = defaultConflictRange();
      const fromDate = query.get("dateFrom") || dateRange.from;
      const toDate = query.get("dateTo") || dateRange.to;
      const posDate = query.get("posDate") || query.get("pos_date") || today();

      const payload = createConflictPayload({
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
          // Gunakan futureBookNumber (strict dari ota_book_number) bukan otaBookNumber
          // yang bisa fallback ke co_ota_book_number (booking current guest).
          const matchedFuture = row.futureBookNumber
            ? summary?.bookingsByGenId?.[row.futureBookNumber]
            : null;

          // Jika WO ini future reservation (punya futureBookNumber) tapi booking tidak
          // ditemukan di getDataBookingForWo (kosong atau hanya berisi current guest),
          // maka co_date dari WO response tidak dipakai — CO date future belum diketahui.
          const resolvedCoDate =
            row.futureBookNumber && !matchedFuture
              ? null
              : matchedFuture?.checkoutDate || row.coDate;

          return {
            ...row,
            activeReservation: active,
            latestReservation: latest,
            futureReservation: matchedFuture || null,
            booking: active || matchedFuture || latest || null,
            ciDate: matchedFuture?.checkinDate || row.ciDate,
            coDate: resolvedCoDate,
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
        // Gunakan futureBookNumber (strict dari ota_book_number) bukan otaBookNumber
        // yang bisa fallback ke co_ota_book_number (booking current guest).
        const matchedFuture = row.futureBookNumber
          ? summary?.bookingsByGenId?.[row.futureBookNumber]
          : null;
        const hasPendingChurnHistory = pendingChurnByRoom.get(row.foRoomsId) ?? false;

        // Jika WO ini future reservation (punya futureBookNumber) tapi booking tidak
        // ditemukan di getDataBookingForWo (kosong atau hanya berisi current guest),
        // maka co_date dari WO response tidak dipakai — CO date future belum diketahui.
        const resolvedCoDate =
          row.futureBookNumber && !matchedFuture ? null : matchedFuture?.checkoutDate || row.coDate;

        return {
          ...row,
          activeReservation: summary?.active || null,
          latestReservation: summary?.latest || null,
          futureReservation: matchedFuture || null,
          booking: summary?.active || null,
          ciDate: matchedFuture?.checkinDate || row.ciDate,
          coDate: resolvedCoDate,
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
        const breakContractRoomIds = [
          ...new Set(
            rows
              .filter((row) => Boolean(row.breakContractDate))
              .map((row) => row.foRoomsId)
              .filter((id) => Number.isFinite(Number(id))),
          ),
        ];

        const [summaries, woHistories] = await Promise.all([
          mapWithConcurrency(roomIds, 6, async (roomId) => [
            roomId,
            await getRoomBookingSummary(session, roomId).catch(() => null),
          ]),
          mapWithConcurrency(breakContractRoomIds, 6, async (roomId) => [
            roomId,
            await getRoomWoHistory(session, roomId).catch(() => []),
          ]),
        ]);

        const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
        const churnInfoByRoom = new Map(
          woHistories.map(([roomId, history]) => [roomId, evaluatePendingChurnHistory(history)]),
        );

        const enrichedRows = rows.map((row) => {
          const summary = bookingByRoom.get(row.foRoomsId);
          // Gunakan futureBookNumber (strict dari ota_book_number) bukan otaBookNumber
          // yang bisa fallback ke co_ota_book_number (booking current guest).
          const matchedFuture = row.futureBookNumber
            ? summary?.bookingsByGenId?.[row.futureBookNumber]
            : null;
          const churnInfo = churnInfoByRoom.get(row.foRoomsId) || {
            hasActivePendingChurn: false,
            hasCancelledPendingChurn: false,
          };
          const hasPendingChurnHistory = churnInfo.hasActivePendingChurn;
          const isPendingChurnCancelled = churnInfo.hasCancelledPendingChurn;

          // Jika WO ini future reservation (punya futureBookNumber) tapi booking tidak
          // ditemukan di getDataBookingForWo (kosong atau hanya berisi current guest),
          // maka co_date dari WO response tidak dipakai — CO date future belum diketahui.
          const resolvedCoDate =
            row.futureBookNumber && !matchedFuture
              ? null
              : matchedFuture?.checkoutDate || row.coDate;

          return {
            ...row,
            activeReservation: summary?.active || null,
            latestReservation: summary?.latest || null,
            futureReservation: matchedFuture || null,
            booking: summary?.active || null,
            ciDate: matchedFuture?.checkinDate || row.ciDate,
            coDate: resolvedCoDate,
            hasPendingChurnHistory,
            isPendingChurnCancelled,
            // Recompute isBreakContract dengan info Pending Churn & status unit
            isBreakContract: checkIsBreakContract(
              row.breakContractDate,
              row.endContractDate,
              new Date(),
              hasPendingChurnHistory,
              {
                propertyStatus: row.propertyStatus || row.property_status,
                hotelStatus: row.hotelStatus || row.hotel_status,
                isPendingChurnCancelled,
              },
            ),
          };
        });
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
    const breakContractRoomIds = [
      ...new Set(
        scheduledRows
          .filter((row) => Boolean(row.breakContractDate))
          .map((row) => row.foRoomsId)
          .filter((id) => Number.isFinite(Number(id))),
      ),
    ];

    const [summaries, woHistories] = await Promise.all([
      mapWithConcurrency(roomIds, 6, async (roomId) => [
        roomId,
        await getRoomBookingSummary(session, roomId).catch(() => null),
      ]),
      mapWithConcurrency(breakContractRoomIds, 6, async (roomId) => [
        roomId,
        await getRoomWoHistory(session, roomId).catch(() => []),
      ]),
    ]);

    const bookingByRoom = new Map(summaries.filter(([_, val]) => Boolean(val)));
    const churnInfoByRoom = new Map(
      woHistories.map(([roomId, history]) => [roomId, evaluatePendingChurnHistory(history)]),
    );

    const rows = scheduledRows
      .map((row) => {
        const summary = bookingByRoom.get(row.foRoomsId);
        const latest = summary?.latest || summary?.active || null;
        const booking = latest;

        const formattedCheckinDate = booking?.formattedCheckinDate || null;
        const formattedCheckoutDate = booking?.formattedCheckoutDate || null;

        const churnInfo = churnInfoByRoom.get(row.foRoomsId) || {
          hasActivePendingChurn: false,
          hasCancelledPendingChurn: false,
        };
        const hasPendingChurnHistory = churnInfo.hasActivePendingChurn;
        const isPendingChurnCancelled = churnInfo.hasCancelledPendingChurn;

        const isBreakContract = checkIsBreakContract(
          row.breakContractDate,
          row.endContractDate,
          new Date(),
          hasPendingChurnHistory,
          {
            propertyStatus: row.propertyStatus || row.property_status,
            hotelStatus: row.hotelStatus || row.hotel_status,
            isPendingChurnCancelled,
          },
        );

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
          hasPendingChurnHistory,
          isPendingChurnCancelled,
          isBreakContract,
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
