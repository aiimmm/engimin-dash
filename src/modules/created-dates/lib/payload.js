// ============================================================================
// LIB / API — /dashboard/created-dates (Payload & Stats)
// Purpose: Payload generator and department (DIC) statistics calculation
// Description: Used by Created Dates route handler and dashboard stats widgets
// ============================================================================

import {
  getDepartmentCategory,
  getRoomStatusCategory,
  today,
} from "@/modules/shared/work-orders/lib";

/**
 * Generate request payload for Created Today Work Orders.
 */
export function createCreatedTodayPayload(filters = {}) {
  const date = today();
  return {
    status: filters.status?.length ? filters.status : ["1", "2"],
    cluster_id: filters.cluster ? [filters.cluster] : [],
    engginerId: filters.engineer || "",
    departmentInCharge: filters.department || "",
    from_date: filters.dateFrom || filters.fromDate || date,
    to_date: filters.dateTo || filters.toDate || date,
    skipCountPaging: 0,
    poStatus: "",
    pos_date: filters.posDate || filters.pos_date || "",
    limit: String(filters.limit ?? ""),
    offset: Number(filters.offset || 0),
    sortBy: filters.sortBy || "",
    sortDirection: filters.sortDirection || "",
  };
}

/**
 * Calculate department and room status counters for Created Today work orders.
 */
export function calculateDicStats(rows = []) {
  const stats = {
    Total: rows.length,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
    Engineering: 0,
    ORM: 0,
    Traveliomart: 0,
    CS: 0,
    Operational: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
  };

  rows.forEach((row) => {
    // Room Status calculation
    const roomCat = getRoomStatusCategory(row.roomStatus);
    if (roomCat === "Major") stats.Major += 1;
    else if (roomCat === "Minor") stats.Minor += 1;
    else stats.NoRoomStatus += 1;

    // DIC calculation
    const deptCat = getDepartmentCategory(row.department);
    if (deptCat === "Engineering") stats.Engineering += 1;
    else if (deptCat === "ORM") stats.ORM += 1;
    else if (deptCat === "Traveliomart") stats.Traveliomart += 1;
    else if (deptCat === "CS") stats.CS += 1;
    else if (deptCat === "Operational") stats.Operational += 1;
    else if (deptCat === "Technical Auditor") stats.TechnicalAuditor += 1;
    else if (deptCat === "Admin Inventory") stats.AdminInventory += 1;
    else stats.Unassigned += 1;
  });

  return stats;
}
