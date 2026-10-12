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
import { today } from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

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

  return {
    ...item,
    id: item.id || item.wo_no || item.woNumber || item.number || String(idx),
    number: item.number || item.id || item.wo_no || "",
    cluster: cluster ? String(cluster).trim() : "—",
    cluster_name: cluster ? String(cluster).trim() : "—",
    roomCode: roomCode ? String(roomCode).trim() : "—",
    towerName: towerName ? String(towerName).trim() : "—",
    roomName: roomName ? String(roomName).trim() : unit ? String(unit).trim() : "—",
    unit: unit || (towerName ? `${towerName} - ${roomName}` : roomName),
    department: department ? String(department).trim() : "Engineering",
    department_in_charge: department ? String(department).trim() : "Engineering",
    fullname: item.fullname || item.currentEngineerName || item.engineer || "UNASSIGNED",
    schedule_date: item.schedule_date || item.action_date || item.actionDate || "—",
    note: item.note || item.remark || "—",
    room_status: item.room_status || item.roomstatuses_name || item.roomStatus || "—",
    engineer_status: item.engineer_status || (item.fullname ? "Assign" : "Unassign"),
    status: item.status || item.wo_status || "New",
    is_guestAppointment: item.is_guestAppointment ?? "no",
  };
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

  const basePayload = {
    cluster: [],
    date: fromDate,
    start_time: "",
    end_time: "",
    engineer_status: "",
    engineer_name: [],
    room_status: "",
  };

  const completedWoPayload = createCompletedWorkOrdersPayload({
    dateFrom: fromDate,
    dateTo: toDate,
  });

  const requestOptions = { headers, timeout: 0 };

  try {
    const [summaryRes, workOrdersRes, engineerRes, listWORes, completedRes] = await Promise.all([
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
      upstreamApi
        .post(`/listWONewSedangDiRefactor?id=${userId}`, completedWoPayload, requestOptions)
        .catch((err) => {
          console.error("Failed to fetch completed listWONewSedangDiRefactor:", err.message);
          return { data: { data: [] } };
        }),
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
        woDetailMap.get(String(t.wo_no).trim());

      return normalizeTask(
        {
          ...t,
          ...(matched
            ? {
                cluster_name: matched.cluster_name || matched.cluster,
                roomcode: matched.roomcode || matched.roomCode,
                towername: matched.towername || matched.towerName,
                roomname: matched.roomname || matched.roomName,
                department_in_charge:
                  matched.department_in_charge || matched.department || t.department_in_charge,
              }
            : {}),
        },
        idx,
      );
    });

    const engineerTotals = Array.isArray(engineerRes.data?.payload?.data)
      ? engineerRes.data.payload.data
      : Array.isArray(engineerRes.data?.data)
        ? engineerRes.data.data
        : [];

    // Parse completed work orders & CTO response
    const rawCompletedRows = Array.isArray(completedRes.data?.data)
      ? completedRes.data.data
      : Array.isArray(completedRes.data?.payload?.data)
        ? completedRes.data.payload.data
        : Array.isArray(completedRes.data?.payload)
          ? completedRes.data.payload
          : [];

    const completedTasks = rawCompletedRows
      .map((item, idx) => normalizeCompletedWoItem(item, idx))
      .filter((task) => {
        const eng = String(task.engineer || "")
          .trim()
          .toLowerCase();
        return eng && eng !== "unassigned" && eng !== "—" && eng !== "-";
      });

    return NextResponse.json({
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
    });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
