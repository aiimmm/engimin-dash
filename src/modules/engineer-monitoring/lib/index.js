// ============================================================================
// LIB / COMPLETED-WO — Payload & Helpers for Completed Work Orders & CTO Monitoring
// ============================================================================

import { today } from "@/modules/shared/work-orders/lib";

/**
 * Generate request payload for Completed Work Orders.
 * Status: ["3"] (Completed)
 */
export function createCompletedWorkOrdersPayload(filters = {}) {
  const tDate = today();
  const dateFrom = filters.dateFrom || filters.actionDate_from || tDate;
  const dateTo = filters.dateTo || filters.actionDate_to || tDate;

  return {
    status: ["3"],
    cluster_id: Array.isArray(filters.cluster_id)
      ? filters.cluster_id
      : filters.cluster
        ? [filters.cluster]
        : [],
    engginerId: filters.engginerId || filters.engineer || "",
    departmentInCharge: filters.departmentInCharge || filters.department || "",
    actionDate_from: dateFrom,
    actionDate_to: dateTo,
    sortBy: filters.sortBy || "newest",
    skipCountPaging: 0,
    poStatus: filters.poStatus || "",
    pos_date: filters.pos_date || filters.posDate || dateTo || tDate,
    limit: filters.limit !== undefined && filters.limit !== null ? String(filters.limit) : "",
    offset: Number(filters.offset || 0),
  };
}

/**
 * Calculate total CTO price for a single WO item.
 * Uses ctoPrice (base + markup) from ctoList or fallback to root ctoPrice.
 */
export function calculateWoCtoPrice(item) {
  if (!item) return 0;

  // 1. Prefer item.ctoPrice if directly provided
  if (item.ctoPrice !== null && item.ctoPrice !== undefined && item.ctoPrice !== "") {
    const parsed = Number(item.ctoPrice);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  // 2. If ctoList is present and is an array, sum ctoPrice (or ctoBasePrice + ctoMarkupPrice)
  if (Array.isArray(item.ctoList) && item.ctoList.length > 0) {
    const listSum = item.ctoList.reduce((acc, cto) => {
      const price =
        cto.ctoPrice !== undefined && cto.ctoPrice !== null && cto.ctoPrice !== ""
          ? Number(cto.ctoPrice)
          : Number(cto.ctoBasePrice || 0) + Number(cto.ctoMarkupPrice || 0);
      return acc + (isNaN(price) ? 0 : price);
    }, 0);
    if (listSum > 0) return listSum;
  }

  return 0;
}

/**
 * Normalize raw upstream completed WO response item into standardized UI model.
 */
export function normalizeCompletedWoItem(item, idx = 0) {
  const tracing = Array.isArray(item.tracingSchedule)
    ? item.tracingSchedule[0] || {}
    : Array.isArray(item.tracing_schedule)
      ? item.tracing_schedule[0] || {}
      : {};

  const engineerName =
    item.currentEngineerName ||
    tracing.enggineer ||
    tracing.eng1name ||
    item.eng1name ||
    item.engineerName ||
    item.engineer ||
    "UNASSIGNED";

  const woNumber =
    item.wo_no ||
    item.woNumber ||
    item.number ||
    item.code ||
    tracing.code ||
    String(item.id || item.workorders_id || idx);

  const cluster =
    item.cluster_name || item.clusterName || item.cluster || item.cluster_id?.name || "—";

  const roomCode = item.roomcode || item.roomCode || tracing.roomnumber || item.roomnumber || "—";

  const towerName = item.towername || item.towerName || item.tower || "—";

  const roomName = item.roomname || item.roomName || item.room || tracing.roomnumber || "—";

  const department =
    item.department_in_charge ||
    item.departmentInCharge ||
    item.department ||
    tracing.departmentname ||
    item.departmentname ||
    "Engineering";

  const actionDate =
    item.action_date ||
    item.actionDate ||
    tracing.action_date ||
    item.completed_date ||
    tracing.completed_date ||
    "—";

  const ctoPrice = calculateWoCtoPrice(item);
  const ctoList = Array.isArray(item.ctoList) ? item.ctoList : [];
  const ctoLength = Number(item.ctoLength ?? ctoList.length);
  const ctoStatus = item.ctoStatus || (ctoPrice > 0 ? "APPROVED" : "—");
  const isCTOApproved = Number(item.isCTOApproved ?? (ctoPrice > 0 ? 1 : 0));

  const note = item.note || item.remark || tracing.note || "—";

  // Extract completedUser: prefer ctoList[0]?.created_user, fallback to tracing.complete_user / completed_user / complete_by
  const firstCto = ctoList[0] || {};
  const completedUser =
    firstCto.created_user ||
    firstCto.createdUser ||
    item.complete_user ||
    item.completed_user ||
    item.completeUser ||
    item.completedUser ||
    tracing.complete_user ||
    tracing.completed_user ||
    item.created_user ||
    item.createdUser ||
    "—";

  // Extract chargeTo: prefer ctoList[0]?.chargeTo, fallback to item.chargeTo / item.charge_to
  const chargeTo =
    firstCto.chargeTo || firstCto.charge_to || item.chargeTo || item.charge_to || "—";

  return {
    id: String(item.id || item.workorders_id || woNumber || idx),
    woNumber,
    woStatus: item.status || tracing.status || "Completed",
    engineer: engineerName ? String(engineerName).trim() : "UNASSIGNED",
    cluster: String(cluster).trim(),
    roomCode: String(roomCode).trim(),
    towerName: String(towerName).trim(),
    roomName: String(roomName).trim(),
    unit: towerName && towerName !== "—" ? `${towerName} - ${roomName}` : roomName,
    department: String(department).trim(),
    department_in_charge: String(department).trim(),
    actionDate,
    note,
    completedUser: String(completedUser).trim(),
    chargeTo: String(chargeTo).trim(),
    ctoPrice,
    ctoLength,
    ctoStatus,
    isCTOApproved,
    ctoList,
    tracingSchedule: Array.isArray(item.tracingSchedule)
      ? item.tracingSchedule
      : Array.isArray(item.tracing_schedule)
        ? item.tracing_schedule
        : [],
  };
}
