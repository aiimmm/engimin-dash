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
 * Calculate total CTO price / engineer revenue for a single WO item.
 * Supports:
 * 1. Standard CTO (ctoPrice or sum of ctoList)
 * 2. Payment Link (subTotalPrice / jasa from paymentList or engineeringPropertyFee)
 * 3. Temporary Expense / PO (cto_price / price from tempExpense)
 * Excludes: Pure Post Charge guest penalties without engineer labor/expense.
 */
export function calculateWoCtoPrice(item) {
  if (!item) return 0;

  // 1. PRIORITAS 1: Form CTO Standar (jika ada ctoPrice / ctoList)
  if (item.ctoPrice !== null && item.ctoPrice !== undefined && item.ctoPrice !== "") {
    const parsed = Number(item.ctoPrice);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

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

  // 2. PRIORITAS 2: Payment Link (Jasa / Perbaikan berbayar oleh Guest/Owner termasuk PPN)
  if (Array.isArray(item.paymentList) && item.paymentList.length > 0) {
    const sumPayment = item.paymentList.reduce((acc, p) => {
      const val = Number(p.price ?? p.subTotalPrice ?? p.jasa ?? p.feeAmount ?? 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (sumPayment > 0) return sumPayment;
  }

  if (
    item.engineeringPropertyFee &&
    Array.isArray(item.engineeringPropertyFee.items) &&
    item.engineeringPropertyFee.items.length > 0
  ) {
    const sumFeeItems = item.engineeringPropertyFee.items.reduce((acc, p) => {
      const val = Number(p.price ?? p.subTotalPrice ?? p.jasa ?? 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (sumFeeItems > 0) return sumFeeItems;
  }

  if (item.totalPaymentFeeAmount !== null && item.totalPaymentFeeAmount !== undefined) {
    const parsed = Number(item.totalPaymentFeeAmount);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  if (
    item.engineeringPropertyFee?.feeAmount !== null &&
    item.engineeringPropertyFee?.feeAmount !== undefined
  ) {
    const parsed = Number(item.engineeringPropertyFee.feeAmount);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 3. PRIORITAS 3: Temporary Expense / PO (Belanja Material Luar / Penggantian Aset)
  if (Array.isArray(item.tempExpense) && item.tempExpense.length > 0) {
    const sumTemp = item.tempExpense.reduce((acc, t) => {
      const val = Number(t.cto_price ?? t.price ?? 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    if (sumTemp > 0) return sumTemp;
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
  const ctoLength = Number(
    item.ctoLength ??
      (ctoList.length > 0
        ? ctoList.length
        : item.paymentList?.length > 0
          ? item.paymentList.length
          : item.tempExpense?.length || (ctoPrice > 0 ? 1 : 0)),
  );
  const ctoStatus = item.ctoStatus || (ctoPrice > 0 ? "APPROVED" : "—");
  const isCTOApproved = Number(item.isCTOApproved ?? (ctoPrice > 0 ? 1 : 0));

  const note = item.note || item.remark || tracing.note || "—";

  // Extract completedUser: prefer ctoList / tempExpense / paymentList, fallback to tracing / item
  const firstCto = ctoList[0] || item.tempExpense?.[0] || item.paymentList?.[0] || {};
  const completedUser =
    firstCto.created_user ||
    firstCto.createdUser ||
    firstCto.created_by ||
    firstCto.createdBy ||
    item.complete_user ||
    item.completed_user ||
    item.completeUser ||
    item.completedUser ||
    tracing.complete_user ||
    tracing.completed_user ||
    item.created_user ||
    item.createdUser ||
    "—";

  // Extract paymentLinkTo: check engineeringPropertyFee.miscPayment.paymentLinkTo or miscPayment.paymentLinkTo
  const paymentLinkTo =
    item.engineeringPropertyFee?.miscPayment?.paymentLinkTo ||
    item.miscPayment?.paymentLinkTo ||
    null;

  // Extract chargeTo: prefer paymentLinkTo (Customer/Owner), fallback to firstCto / item
  const rawChargeTo =
    paymentLinkTo ||
    firstCto.chargeTo ||
    firstCto.charge_to ||
    item.chargeTo ||
    item.charge_to ||
    (item.paymentList?.length > 0 ? "Customer" : "—");

  const chargeTo = String(rawChargeTo || "—").trim();

  const engineerType =
    item.engineer_type ||
    item.user_type ||
    item.engineerType ||
    item.userType ||
    tracing.engineer_type ||
    tracing.user_type ||
    "";

  return {
    id: String(item.id || item.workorders_id || woNumber || idx),
    woNumber,
    woStatus: item.status || tracing.status || "Completed",
    engineer: engineerName ? String(engineerName).trim() : "UNASSIGNED",
    engineer_username: String(tracing.eng1name || item.eng1name || "").trim(),
    currentEngineerName: String(item.currentEngineerName || item.engineerName || "").trim(),
    engineer_type: String(engineerType).trim().toLowerCase(),
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
