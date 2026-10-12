// ============================================================================
// LIB / API — /dashboard/created-dates (Report Generator)
// Purpose: WhatsApp text report generator for created dates work orders
// Description: Formats DIC counters and room status breakdown for WhatsApp sharing
// ============================================================================

import { formatCompactDate } from "@/modules/appointment/lib";
import { today } from "@/modules/shared/work-orders/lib";
import { calculateDicStats } from "./payload";

/**
 * Generate Report Created Today for all clusters or specific selected cluster(s).
 */
export function generateCreatedTodayReport(rows = [], options = {}) {
  const { selectedClusters = [], date = "" } = options;

  let clusterTitleHeader = "REPORT ALL CLUSTER";
  if (selectedClusters.length > 0) {
    const clustersText = selectedClusters.map((c) => String(c).trim().toUpperCase()).join(", ");
    clusterTitleHeader = `REPORT CLUSTER ${clustersText}`;
  }

  const dateLabel = formatCompactDate(date || today());
  const stats = calculateDicStats(rows);

  const lines = [clusterTitleHeader, `WO Created Today (${dateLabel})`, `- Total : ${stats.Total}`];

  // Section 2: Department In Charge (exclude 0-value items)
  const dicItems = [
    { label: "Engineering", count: stats.Engineering },
    { label: "ORM", count: stats.ORM },
    { label: "Traveliomart", count: stats.Traveliomart },
    { label: "CS", count: stats.CS },
    { label: "Operational", count: stats.Operational },
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
