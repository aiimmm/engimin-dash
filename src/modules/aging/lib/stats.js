// ============================================================================
// LIB / API — /dashboard/aging (Stats Calculator)
// Purpose: Department, room status, and unit statistics calculation for Aging Work Orders
// ============================================================================

import { getDepartmentCategory, getRoomStatusCategory } from "@/modules/shared/work-orders/lib";

/**
 * Calculate department and room status counters for Aging work orders.
 */
export function calculateAgingStats(rows = []) {
  const genIds = new Set();
  const stats = {
    Total: rows.length,
    TotalUnit: 0,
    Assigned: 0,
    UnassignedEngineer: 0,
    New: 0,
    OnProgress: 0,
    Engineering: 0,
    ORM: 0,
    Operational: 0,
    Traveliomart: 0,
    CS: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
  };

  rows.forEach((row) => {
    const genId = String(
      row.roomCode || row.roomcode || row.room_code || row.genId || row.gen_id || "",
    ).trim();
    if (genId && genId !== "—" && genId !== "-") {
      genIds.add(genId);
    }

    const eng = String(row.engineer ?? "")
      .trim()
      .toLowerCase();
    const isUnassigned = !eng || eng === "—" || eng === "-" || eng.includes("unassigned");
    if (isUnassigned) {
      stats.UnassignedEngineer += 1;
    } else {
      stats.Assigned += 1;
    }

    const rawStatus = String(row.woStatus || row.status || "").toLowerCase();
    if (
      rawStatus.includes("progress") ||
      rawStatus === "active" ||
      rawStatus === "2" ||
      rawStatus === "on progress"
    ) {
      stats.OnProgress += 1;
    } else {
      stats.New += 1;
    }

    const category = getDepartmentCategory(row.department);
    if (category === "Engineering") stats.Engineering += 1;
    else if (category === "ORM") stats.ORM += 1;
    else if (category === "Traveliomart") stats.Traveliomart += 1;
    else if (category === "CS") stats.CS += 1;
    else if (category === "Operational") stats.Operational += 1;
    else if (category === "Technical Auditor") stats.TechnicalAuditor += 1;
    else if (category === "Admin Inventory") stats.AdminInventory += 1;
    else stats.Unassigned += 1;

    const roomCat = getRoomStatusCategory(row.roomStatus);
    if (roomCat === "Major") stats.Major += 1;
    else if (roomCat === "Minor") stats.Minor += 1;
    else stats.NoRoomStatus += 1;
  });

  stats.TotalUnit = genIds.size;
  return stats;
}
