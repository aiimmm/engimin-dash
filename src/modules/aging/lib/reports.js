// ============================================================================
// LIB / API — /dashboard/aging (Report Generator)
// Purpose: Formatted WhatsApp / text report generator for Aging Work Orders
// ============================================================================

import { formatCompactDate } from "@/modules/appointment/lib";
import { defaultAgingDateRange } from "./payload";
import { calculateAgingStats } from "./stats";

/**
 * Generate formatted report text for Aging Work Orders.
 */
export function generateAgingReport(rows = [], options = {}) {
  const { selectedClusters = [], dateRange = {} } = options;
  let clusterTitleHeader = "REPORT AGING ALL CLUSTER";
  if (selectedClusters.length > 0) {
    const clustersText = selectedClusters.map((c) => String(c).trim().toUpperCase()).join(", ");
    clusterTitleHeader = `REPORT AGING CLUSTER ${clustersText}`;
  }

  const defaultRange = defaultAgingDateRange();
  const fromLabel = formatCompactDate(dateRange?.from || defaultRange.from);
  const toLabel = formatCompactDate(dateRange?.to || defaultRange.to);
  const dateRangeHeader = `WO Aging (${fromLabel} s/d ${toLabel})`;

  const stats = calculateAgingStats(rows);

  const lines = [clusterTitleHeader, dateRangeHeader, `- Total : ${stats.Total}`];

  // Section 2: Department In Charge (exclude 0-value items)
  const dicItems = [
    { label: "Engineering", count: stats.Engineering },
    { label: "ORM", count: stats.ORM },
    { label: "Operational", count: stats.Operational },
    { label: "Traveliomart", count: stats.Traveliomart },
    { label: "CS", count: stats.CS },
    { label: "Technical Auditor", count: stats.TechnicalAuditor },
    { label: "Admin Inventory", count: stats.AdminInventory },
    { label: "Unassigned", count: stats.Unassigned },
  ];

  const activeDicItems = dicItems.filter((item) => item.count > 0);
  if (activeDicItems.length > 0) {
    lines.push("Department In Charge");
    activeDicItems.forEach((item) => {
      lines.push(`- ${item.label} : ${item.count}`);
    });
  }

  // Section 3: Room Status (exclude 0-value items)
  const roomItems = [
    { label: "Major", count: stats.Major },
    { label: "Minor", count: stats.Minor },
    { label: "No Room Status", count: stats.NoRoomStatus },
  ];

  const activeRoomItems = roomItems.filter((item) => item.count > 0);
  if (activeRoomItems.length > 0) {
    lines.push("Room Status");
    activeRoomItems.forEach((item) => {
      lines.push(`- ${item.label} : ${item.count}`);
    });
  }

  return lines.join("\n").trim();
}
