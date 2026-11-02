// ============================================================================
// LIB / API — /dashboard/conflict (Stats & Date Ranges)
// Purpose: Conflict statistical summary calculation & default date range
// Description: Computes total units, statuses, and DIC breakdowns for conflict orders
// ============================================================================

import { addDays, format } from "date-fns";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";

export function defaultConflictRange(baseDate = new Date()) {
  return {
    from: format(addDays(baseDate, 1), "yyyy-MM-dd"),
    to: format(addDays(baseDate, 7), "yyyy-MM-dd"),
  };
}

export function calculateConflictStats(rows = []) {
  const stats = {
    Total: rows.length,
    TotalUnit: new Set(rows.map((r) => r.roomCode).filter(Boolean)).size,
    New: 0,
    OnProgress: 0,
    Engineering: 0,
    Operational: 0,
    Traveliomart: 0,
    CS: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
    Major: 0,
    Minor: 0,
  };

  rows.forEach((row) => {
    // WO Status
    const status = String(row.status || row.woStatus || "").toLowerCase();
    if (status === "new" || status === "1") {
      stats.New += 1;
    } else if (status === "active" || status === "on progress" || status === "2") {
      stats.OnProgress += 1;
    }

    // Room Status
    const roomStatus = String(row.roomStatus || "").toLowerCase();
    if (roomStatus === "major") stats.Major += 1;
    if (roomStatus === "minor") stats.Minor += 1;

    // DIC
    const deptCat = getDepartmentCategory(row.department);
    if (deptCat === "Engineering") stats.Engineering += 1;
    else if (deptCat === "Operational") stats.Operational += 1;
    else if (deptCat === "Traveliomart") stats.Traveliomart += 1;
    else if (deptCat === "Admin Inventory") stats.AdminInventory += 1;
    else if (deptCat === "ORM") stats.ORM = (stats.ORM || 0) + 1;
    else if (deptCat === "CS") stats.CS += 1;
    else if (deptCat === "Technical Auditor") stats.TechnicalAuditor += 1;
    else stats.Unassigned += 1;
  });

  return stats;
}
