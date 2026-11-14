// ============================================================================
// API Route — /api/engineer-monitoring (Active Engineer Monitoring Dashboard)
// Purpose: Aggregate summary statistics, task lists, and engineer performance metrics
// Used by: /dashboard (Overview Monitoring Tab)
// ============================================================================

import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import {
  createCompletedWorkOrdersPayload,
  normalizeCompletedWoItem,
} from "@/modules/engineer-monitoring/lib";
import { safeError } from "@/lib/security";
import { checkIsBreakContract, today } from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

// Next.js Route Segment Config - Allow up to 90 seconds for heavy upstream queries
export const maxDuration = 90;
export const dynamic = "force-dynamic";

function normalizeTask(item, idx) {
  const cluster =
    item.cluster_name ||
    item.clusterName ||
    item.cluster ||
    item.cluster_id?.name ||
    item.clusterId ||
    "";

  const roomCode = item.roomcode || item.roomCode || item.room_code || item.roomCodeNumber || "";

  const towerName =
    item.towername || item.towerName || item.tower_name || item.towercode || item.towerCode || "";

  const roomName = item.roomname || item.roomName || item.room_name || "";

  const unit = item.unit || "";

  const department =
    item.department_in_charge ||
    item.departmentInCharge ||
    item.department ||
    item.departmentname ||
    "";

  const status = item.status || item.wo_status || "New";
  const engineer_status = item.engineer_status || (item.fullname ? "Assign" : "Unassign");
  const isPreComplete = item.isPreComplete ?? item.is_precomplete ?? item.is_pre_complete ?? false;
  const total_pre_completed = Number(item.total_pre_completed ?? 0);

  const reason =
    item.reason || item.reason_reject || item.reject_reason || item.rejected_reason || "";
  const remark = item.remark || item.note || item.notes || "";
  const wo_articles = item.wo_articles || item.articles || item.article || "";
  const wo_type = item.wo_type || item.woType || item.type || "";
  const wo_subtype = item.wo_subtype || item.woSubtype || item.subtype || "";
  const action_date = item.action_date || item.actionDate || item.action_time || "";
  const tracingSchedule = item.tracingSchedule || item.tracing_schedule || [];
  const rejected_wo_guarantee_date =
    item.rejected_wo_guarantee_date &&
    item.rejected_wo_guarantee_date !== "—" &&
    item.rejected_wo_guarantee_date !== "-"
      ? item.rejected_wo_guarantee_date
      : null;

  const detail = Array.isArray(item.detail)
    ? item.detail
    : Array.isArray(item.details)
      ? item.details
      : [];

  // Extract latest note from admin who rejected/completed the schedule
  let admin_completed_note = "";
  let admin_completed_user = "";
  let admin_completed_date = "";

  if (detail.length > 0) {
    let rejectingAdmin = null;
    for (let i = detail.length - 1; i >= 0; i--) {
      const dItem = detail[i];
      const dRemark = String(dItem.remark || "").trim();
      const rejectMatch = dRemark.match(/rejected by\s+([^.\n\r]+)/i);
      if (rejectMatch) {
        rejectingAdmin = rejectMatch[1].trim();
        break;
      }
      if (
        (dItem.isComplete === 1 || String(dItem.status || "").toUpperCase() === "COMPLETE") &&
        dItem.created_user &&
        !String(dItem.created_user).toLowerCase().endsWith(".eng")
      ) {
        rejectingAdmin = String(dItem.created_user).trim();
        break;
      }
    }

    const isSystemLog = (text = "") => {
      const t = String(text || "").trim();
      if (
        !t ||
        t === "-" ||
        t === "—" ||
        t.toLowerCase() === "null" ||
        t.toLowerCase() === "none"
      ) {
        return true;
      }
      return (
        /^create wo from/i.test(t) ||
        /^extend wo from/i.test(t) ||
        /^extend wo /i.test(t) ||
        /^schedule wo .* rejected by/i.test(t) ||
        /^schedule wo .* completed by/i.test(t) ||
        /^schedule wo .* approved by/i.test(t) ||
        /\[remark for wo rejected\]/i.test(t) ||
        /^assign to/i.test(t) ||
        /^reassign to/i.test(t) ||
        /^status changed to/i.test(t) ||
        /^auto close/i.test(t) ||
        /melakukan pending workorder dengan alasan/i.test(t)
      );
    };

    const getCleanItemNote = (dItem) => {
      const remark = String(dItem.remark || "").trim();
      const hkNotes = String(dItem.housekeeping_notes || "").trim();

      // Jika seluruh item adalah log extend WO, create WO, atau log reject/complete otomatis sistem,
      // maka seluruh item ini adalah aksi sistem dan bukan catatan alasan reject
      if (
        /^extend wo/i.test(remark) ||
        /^create wo/i.test(remark) ||
        /^schedule wo .* rejected by/i.test(remark) ||
        /^schedule wo .* completed by/i.test(remark) ||
        /^schedule wo .* approved by/i.test(remark) ||
        /^status changed/i.test(remark) ||
        /^assign to/i.test(remark) ||
        /^reassign to/i.test(remark) ||
        /^auto close/i.test(remark) ||
        /melakukan pending workorder dengan alasan/i.test(remark)
      ) {
        return "";
      }

      if (hkNotes && !isSystemLog(hkNotes)) return hkNotes;
      if (remark && !isSystemLog(remark)) return remark;
      return "";
    };

    const isEngineerUser = (userName = "") => {
      const u = String(userName || "")
        .trim()
        .toLowerCase();
      const eng = String(item.fullname || item.currentEngineerName || item.engineer || "")
        .trim()
        .toLowerCase();
      return (
        !u ||
        u.endsWith(".eng") ||
        u.startsWith("v-") ||
        u.startsWith("vnd ") ||
        u.includes("vendor") ||
        (eng && (u.includes(eng) || eng.includes(u)))
      );
    };

    // Search backwards for the most recent human note from a non-engineer admin
    for (let i = detail.length - 1; i >= 0; i--) {
      const dItem = detail[i];
      const createdUser = String(dItem.created_user || dItem.updated_user || "").trim();
      const text = getCleanItemNote(dItem);

      if (!isEngineerUser(createdUser) && text) {
        admin_completed_note = text;
        admin_completed_user = createdUser;
        admin_completed_date = dItem.update_time || dItem.created_date || dItem.updated_date || "";
        break;
      }
    }
  }

  // Prioritize explicit WO number starting with "WO" over internal numeric database IDs
  const rawWoCandidates = [item.wo_no, item.woNumber, item.number, item.code, item.id];

  const woPrefixCandidate = rawWoCandidates.find(
    (c) => c && typeof c === "string" && c.trim().toUpperCase().startsWith("WO"),
  );

  const finalWoNo =
    woPrefixCandidate?.trim() ||
    (typeof item.wo_no === "string" && item.wo_no.trim() && !/^\d+$/.test(item.wo_no.trim())
      ? item.wo_no.trim()
      : null) ||
    (typeof item.woNumber === "string" &&
    item.woNumber.trim() &&
    !/^\d+$/.test(item.woNumber.trim())
      ? item.woNumber.trim()
      : null) ||
    (typeof item.number === "string" && item.number.trim() && !/^\d+$/.test(item.number.trim())
      ? item.number.trim()
      : null) ||
    (item.wo_no && String(item.wo_no).trim()) ||
    (item.woNumber && String(item.woNumber).trim()) ||
    (item.number && String(item.number).trim()) ||
    String(item.id || idx);

  return {
    id: String(finalWoNo),
    wo_no: String(finalWoNo),
    woNumber: String(finalWoNo),
    internal_id: item.id ? String(item.id) : null,
    fullname: item.fullname || item.currentEngineerName || item.engineer || "UNASSIGNED",
    cluster: cluster ? String(cluster).trim() : "—",
    cluster_name: cluster ? String(cluster).trim() : "—",
    roomCode: roomCode ? String(roomCode).trim() : "—",
    towerName: towerName ? String(towerName).trim() : "—",
    roomName: roomName ? String(roomName).trim() : unit ? String(unit).trim() : "—",
    unit: unit || (towerName ? `${towerName} - ${roomName}` : roomName),
    department: department ? String(department).trim() : "Engineering",
    department_in_charge: department ? String(department).trim() : "Engineering",
    status,
    wo_status: status,
    engineer_status,
    isPreComplete,
    total_pre_completed,
    reason,
    remark,
    wo_articles,
    article: wo_articles,
    wo_type,
    wo_subtype,
    action_date,
    actionDate: action_date,
    rejected_wo_guarantee_date,
    admin_completed_note,
    admin_completed_user,
    admin_completed_date,
    hasPendingChurnHistory: Boolean(item.hasPendingChurnHistory),
    isPendingChurnCancelled: Boolean(item.isPendingChurnCancelled),
    isBreakContract: checkIsBreakContract(
      item.breakcontract_date || item.breakContractDate || null,
      item.endcontract_date || item.endContractDate || null,
      new Date(),
      Boolean(item.hasPendingChurnHistory),
      {
        propertyStatus: item.property_status || item.propertyStatus || "Active",
        hotelStatus: item.hotel_status || item.hotelStatus || "active",
        isPendingChurnCancelled: Boolean(item.isPendingChurnCancelled),
      },
    ),
    is_break_contract: checkIsBreakContract(
      item.breakcontract_date || item.breakContractDate || null,
      item.endcontract_date || item.endContractDate || null,
      new Date(),
      Boolean(item.hasPendingChurnHistory),
      {
        propertyStatus: item.property_status || item.propertyStatus || "Active",
        hotelStatus: item.hotel_status || item.hotelStatus || "active",
        isPendingChurnCancelled: Boolean(item.isPendingChurnCancelled),
      },
    ),
    breakcontract_date: item.breakcontract_date || item.breakContractDate || null,
    breakContractDate: item.breakcontract_date || item.breakContractDate || null,
    endcontract_date: item.endcontract_date || item.endContractDate || null,
    endContractDate: item.endcontract_date || item.endContractDate || null,
    property_status: item.property_status || item.propertyStatus || "Active",
    propertyStatus: item.property_status || item.propertyStatus || "Active",
    hotel_status: item.hotel_status || item.hotelStatus || "active",
    hotelStatus: item.hotel_status || item.hotelStatus || "active",
    fo_rooms_id: item.fo_rooms_id || item.foRoomsId || null,
  };
}

async function fetchEngineeringList(userId, headers) {
  const options = { headers, timeout: 10000 };
  const attempts = [
    () => upstreamApi.get(`/listEngineering?id=`, options),
    () => upstreamApi.get(`/listEngineering?id=${userId}`, options),
    () => upstreamApi.post(`/listEngineering?id=`, {}, options),
  ];

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      const list =
        res.data?.data ||
        res.data?.payload?.data ||
        res.data?.payload ||
        res.data?.result ||
        res.data?.rows ||
        res.data?.list ||
        (Array.isArray(res.data) ? res.data : null);

      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch {
      // ignore and try next attempt
    }
  }
  return [];
}

// In-memory cache & in-flight request deduplication
const MONITORING_CACHE_TTL_MS = 30 * 1000; // 30 detik
const monitoringResponseCache = new Map();
const inFlightRequests = new Map();

// Engineering list cache (5 menit)
const ENGINEERING_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedEngineeringList = null;
let cachedEngineeringListExpiresAt = 0;

async function getCachedEngineeringList(userId, headers) {
  if (cachedEngineeringList && cachedEngineeringListExpiresAt > Date.now()) {
    return cachedEngineeringList;
  }
  const list = await fetchEngineeringList(userId, headers);
  if (Array.isArray(list) && list.length > 0) {
    cachedEngineeringList = list;
    cachedEngineeringListExpiresAt = Date.now() + ENGINEERING_LIST_CACHE_TTL_MS;
  }
  return list;
}

export async function GET(request) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const isValidDate = (d) =>
    d &&
    typeof d === "string" &&
    d !== "0" &&
    d !== "undefined" &&
    d !== "null" &&
    d.trim().length >= 8;

  const rawFrom =
    searchParams.get("dateFrom") || searchParams.get("actionDate_from") || searchParams.get("date");
  const rawTo =
    searchParams.get("dateTo") || searchParams.get("actionDate_to") || searchParams.get("date");

  const fromDate = isValidDate(rawFrom) ? rawFrom.trim() : today();
  const toDate = isValidDate(rawTo) ? rawTo.trim() : fromDate;

  const userId = encodeURIComponent(session.user.id);
  const headers = authorizationHeaders(session);

  const cacheKey = `${userId}:${fromDate}:${toDate}`;
  const now = Date.now();
  const cached = monitoringResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.payload);
  }

  if (inFlightRequests.has(cacheKey)) {
    try {
      const payload = await inFlightRequests.get(cacheKey);
      return NextResponse.json(payload);
    } catch {
      // In-flight gagal, coba proses langsung
    }
  }

  const basePayload = {
    cluster: [],
    date: fromDate,
    start_time: "",
    end_time: "",
    engineer_status: "",
    engineer_name: [],
    room_status: "",
  };

  const requestOptions = { headers, timeout: 90000 };

  const executePromise = (async () => {
    const [summaryRes, workOrdersRes, engineerRes, listWORes, rawEngineeringList] =
      await Promise.all([
        upstreamApi
          .post(`/getSummaryMonitoringEngineer?id=${userId}`, basePayload, requestOptions)
          .catch((err) => {
            console.error("Failed to fetch getSummaryMonitoringEngineer:", err.message);
            return { data: { data: [] } };
          }),
        upstreamApi
          .post(
            `/getListWorkOrders?id=${userId}`,
            { ...basePayload, limit: "", offset: 0 },
            requestOptions,
          )
          .catch((err) => {
            console.error("Failed to fetch getListWorkOrders:", err.message);
            return { data: { payload: { data: [], totalData: 0 } } };
          }),
        upstreamApi
          .post(
            `/getListEngineerMonitoring?id=${userId}`,
            { ...basePayload, limit: "", offset: 0 },
            requestOptions,
          )
          .catch((err) => {
            console.error("Failed to fetch getListEngineerMonitoring:", err.message);
            return { data: { payload: { data: [], totalData: 0 } } };
          }),
        upstreamApi
          .post(
            `/listWONewSedangDiRefactor?id=${userId}`,
            {
              status: ["1", "2", "3", "5"],
              cluster_id: [],
              engginerId: "",
              departmentInCharge: "",
              actionDate_from: fromDate,
              actionDate_to: toDate,
              skipCountPaging: 0,
              poStatus: "",
              pos_date: toDate,
              limit: "",
              offset: 0,
            },
            requestOptions,
          )
          .catch((err) => {
            console.error("Failed to fetch listWONewSedangDiRefactor:", err.message);
            return { data: { data: [] } };
          }),
        getCachedEngineeringList(userId, headers),
      ]);

    const rawSummaryItem =
      summaryRes.data?.data?.[0] ||
      summaryRes.data?.payload?.data?.[0] ||
      (Array.isArray(summaryRes.data?.data) ? summaryRes.data?.data[0] : summaryRes.data?.data) ||
      (Array.isArray(summaryRes.data?.payload)
        ? summaryRes.data?.payload[0]
        : summaryRes.data?.payload) ||
      {};

    const rawUncompleted = Number(rawSummaryItem.total_uncompleted ?? 0);
    const rawCompleted = Number(rawSummaryItem.total_completed ?? 0);
    const rawPreCompleted = Number(rawSummaryItem.total_pre_completed ?? 0);
    const rawRejected = Number(rawSummaryItem.total_rejected ?? rawSummaryItem.total_reject ?? 0);
    const rawTotalTask = Number(rawSummaryItem.total_task ?? 0);

    const summaryData = {
      total_engineer: Number(rawSummaryItem.total_engineer ?? 0),
      total_pre_completed: rawPreCompleted,
      total_completed: rawCompleted,
      total_uncompleted: rawUncompleted,
      total_pending: Number(rawSummaryItem.total_pending ?? 0),
      total_task:
        rawTotalTask > 0
          ? rawTotalTask
          : rawUncompleted + rawCompleted + rawPreCompleted + rawRejected,
      total_unit_completed: Number(rawSummaryItem.total_unit_completed ?? 0),
      total_unit: Number(rawSummaryItem.total_unit ?? 0),
      total_engineer_completed: Number(rawSummaryItem.total_engineer_completed ?? 0),
      total_rejected: rawRejected,
    };

    const listWODetails = Array.isArray(listWORes.data?.data)
      ? listWORes.data.data
      : Array.isArray(listWORes.data?.payload?.data)
        ? listWORes.data.payload.data
        : [];

    const woDetailMap = new Map();
    listWODetails.forEach((item) => {
      if (item.wo_no) woDetailMap.set(String(item.wo_no).trim(), item);
      if (item.id) woDetailMap.set(String(item.id).trim(), item);
      if (item.woNumber) woDetailMap.set(String(item.woNumber).trim(), item);
    });

    const rawTasks = Array.isArray(workOrdersRes.data?.payload?.data)
      ? workOrdersRes.data.payload.data
      : Array.isArray(workOrdersRes.data?.data)
        ? workOrdersRes.data.data
        : [];

    const tasks = rawTasks.map((t, idx) => {
      const matched =
        woDetailMap.get(String(t.id).trim()) ||
        woDetailMap.get(String(t.number).trim()) ||
        woDetailMap.get(String(t.wo_no).trim()) ||
        woDetailMap.get(String(t.woNumber).trim());

      const preferredWoNo =
        (matched?.wo_no && String(matched.wo_no).trim().toUpperCase().startsWith("WO")
          ? String(matched.wo_no).trim()
          : null) ||
        (matched?.woNumber && String(matched.woNumber).trim().toUpperCase().startsWith("WO")
          ? String(matched.woNumber).trim()
          : null) ||
        (t.wo_no && String(t.wo_no).trim().toUpperCase().startsWith("WO")
          ? String(t.wo_no).trim()
          : null) ||
        (t.woNumber && String(t.woNumber).trim().toUpperCase().startsWith("WO")
          ? String(t.woNumber).trim()
          : null) ||
        (t.number && String(t.number).trim().toUpperCase().startsWith("WO")
          ? String(t.number).trim()
          : null) ||
        (String(t.id || "")
          .trim()
          .toUpperCase()
          .startsWith("WO")
          ? String(t.id).trim()
          : null) ||
        matched?.wo_no ||
        matched?.woNumber ||
        t.wo_no ||
        t.woNumber ||
        t.number ||
        null;

      const roomId =
        matched?.fo_rooms_id || matched?.foRoomsId || t.fo_rooms_id || t.foRoomsId || null;

      const breakcontract_date =
        matched?.breakcontract_date ||
        matched?.breakContractDate ||
        t.breakcontract_date ||
        t.breakContractDate ||
        null;
      const endcontract_date =
        matched?.endcontract_date ||
        matched?.endContractDate ||
        t.endcontract_date ||
        t.endContractDate ||
        null;
      const property_status =
        matched?.property_status ||
        matched?.propertyStatus ||
        t.property_status ||
        t.propertyStatus ||
        "Active";
      const hotel_status =
        matched?.hotel_status ||
        matched?.hotelStatus ||
        t.hotel_status ||
        t.hotelStatus ||
        "active";

      return normalizeTask(
        {
          ...t,
          ...(preferredWoNo ? { wo_no: preferredWoNo, woNumber: preferredWoNo } : {}),
          ...(matched
            ? {
                cluster_name: matched.cluster_name || matched.cluster,
                roomcode: matched.roomcode || matched.roomCode,
                towername: matched.towername || matched.towerName,
                roomname: matched.roomname || matched.roomName,
                department_in_charge:
                  matched.department_in_charge || matched.department || t.department_in_charge,
                wo_articles:
                  matched.wo_articles || matched.articles || matched.article || t.wo_articles,
                wo_type: matched.wo_type || t.wo_type,
                wo_subtype: matched.wo_subtype || t.wo_subtype,
                remark: matched.remark || t.remark,
                reason: matched.reason || t.reason,
                action_date: matched.action_date || t.action_date,
                tracingSchedule:
                  matched.tracingSchedule || matched.tracing_schedule || t.tracingSchedule,
                rejected_wo_guarantee_date:
                  matched.rejected_wo_guarantee_date || t.rejected_wo_guarantee_date,
                detail: matched.detail || t.detail || [],
              }
            : {}),
          breakcontract_date,
          breakContractDate: breakcontract_date,
          endcontract_date,
          endContractDate: endcontract_date,
          property_status,
          propertyStatus: property_status,
          hotel_status,
          hotelStatus: hotel_status,
          fo_rooms_id: roomId,
          foRoomsId: roomId,
          hasPendingChurnHistory: Boolean(t.hasPendingChurnHistory),
          isPendingChurnCancelled: Boolean(t.isPendingChurnCancelled),
        },
        idx,
      );
    });

    const rawEngineerTotals = Array.isArray(engineerRes.data?.payload?.data)
      ? engineerRes.data.payload.data
      : Array.isArray(engineerRes.data?.data)
        ? engineerRes.data.data
        : [];

    const engineerTotals = rawEngineerTotals.map((eng) => ({
      fullname: String(eng.fullname || eng.name || "UNASSIGNED").trim(),
      total_task: Number(eng.total_task ?? 0),
      total_unit: Number(eng.total_unit ?? 0),
      total_uncompleted: Number(eng.total_uncompleted ?? 0),
      total_unit_completed: Number(eng.total_unit_completed ?? 0),
      total_engineer_completed: Number(eng.total_engineer_completed ?? 0),
      total_completed: Number(eng.total_completed ?? 0),
      user_type: String(eng.user_type || eng.userType || "").trim(),
    }));

    // Parse completed work orders & CTO directly from listWODetails (status "3" / Completed)
    // Eliminates the duplicate heavy upstream call
    const rawCompletedRows = listWODetails.filter((item) => {
      const s = String(item.workorderstatuses_id || item.status || item.wo_status || "")
        .trim()
        .toLowerCase();
      return (
        s === "3" ||
        s === "completed" ||
        s === "complete" ||
        s.includes("complete") ||
        item.is_completed === 1 ||
        item.is_completed === "1"
      );
    });

    const completedTasks = rawCompletedRows
      .map((item, idx) => {
        const t = normalizeCompletedWoItem(item, idx);
        return {
          id: t.id,
          woNumber: t.woNumber,
          engineer: t.engineer,
          engineer_username: t.engineer_username,
          engineer_type: t.engineer_type,
          cluster: t.cluster,
          department: t.department,
          department_in_charge: t.department_in_charge,
          completedUser: t.completedUser,
          completedDate: t.completedDate,
          actionDate: t.actionDate,
          ctoPrice: t.ctoPrice,
        };
      })
      .filter((task) => {
        const eng = String(task.engineer || "")
          .trim()
          .toLowerCase();
        return eng && eng !== "unassigned" && eng !== "—" && eng !== "-";
      });

    const internalEngineers = [];
    const vendorEngineers = [];

    (rawEngineeringList || []).forEach((eng) => {
      const type = String(eng.user_type || eng.userType || eng.type || "")
        .trim()
        .toLowerCase();
      const fullname = String(eng.fullname || eng.full_name || eng.name || "").trim();
      const username = String(eng.username || eng.user_name || "").trim();
      const name = String(eng.name || eng.fullname || eng.username || "").trim();
      const id = eng.id || eng.user_id || eng.engineer_id || null;

      const isVendor = type === "vendor_engineer" || type.includes("vendor");
      const isInternal =
        type === "engineer" || (!isVendor && (type === "internal" || type === "internal_engineer"));

      if (isInternal) {
        internalEngineers.push({
          id,
          name,
          fullname,
          username,
          user_type: "engineer",
        });
      } else if (isVendor) {
        vendorEngineers.push({
          id,
          name,
          fullname,
          username,
          user_type: "vendor_engineer",
        });
      }
    });

    const responsePayload = {
      success: true,
      date: fromDate,
      dateFrom: fromDate,
      dateTo: toDate,
      summary: summaryData,
      tasks,
      tasksTotal: workOrdersRes.data?.payload?.totalData || tasks.length,
      engineerTotals,
      engineerTotalsTotal: engineerRes.data?.payload?.totalData || engineerTotals.length,
      completedTasks,
      completedTasksTotal: completedTasks.length,
      internalEngineers,
      vendorEngineers,
    };

    monitoringResponseCache.set(cacheKey, {
      payload: responsePayload,
      expiresAt: Date.now() + MONITORING_CACHE_TTL_MS,
    });

    return responsePayload;
  })();

  inFlightRequests.set(cacheKey, executePromise);
  try {
    const payload = await executePromise;
    return NextResponse.json(payload);
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
