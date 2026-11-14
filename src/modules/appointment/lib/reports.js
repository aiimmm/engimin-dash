// ============================================================================
// LIB / API — /dashboard/appointment-dates (Report Generator)
// Purpose: WhatsApp text report generator for appointment dates work orders
// Description: Formats grouped chronological schedule blocks for WhatsApp sharing
// ============================================================================

import { today } from "@/modules/shared/work-orders/lib";

/**
 * Format date to DD/MM/YYYY (e.g. 02/09/2026)
 */
export function formatCompactDate(dateInput) {
  if (!dateInput) {
    const todayStr = today();
    const isoMatch = todayStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    return "";
  }
  const str = String(dateInput).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  const dateObj = new Date(dateInput);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return str;
}

/**
 * Extract time from actionDate string, formatted as HH.mm (e.g. "09.30")
 */
export function extractActionTime(actionDate) {
  if (!actionDate) return "00.00";
  const str = String(actionDate).trim();
  const timeMatch = str.match(/(?:T|\s)(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}.${timeMatch[2]}`;
  }
  return "00.00";
}

/**
 * Generate Report Appointment for all clusters or specific selected cluster(s).
 */
export function generateAppointmentReport(rows = [], options = {}) {
  const { selectedClusters = [], date = "" } = options;

  let clusterTitle = "ALL CLUSTER";
  if (selectedClusters.length > 0) {
    clusterTitle = selectedClusters.map((c) => String(c).trim().toUpperCase()).join(", ");
  }

  const dateLabel = formatCompactDate(date || today());

  // Group rows by action time
  const groups = new Map();
  rows.forEach((row) => {
    const timeKey = extractActionTime(row.actionDate);
    if (!groups.has(timeKey)) {
      groups.set(timeKey, []);
    }
    groups.get(timeKey).push(row);
  });

  // Sort time keys chronologically
  const sortedTimes = [...groups.keys()].sort((a, b) => a.localeCompare(b));

  let totalAppointments = 0;
  const timeBlocks = [];

  sortedTimes.forEach((timeKey) => {
    const itemRows = groups.get(timeKey);
    const seenItems = new Set();
    const blockLines = [`*JAM ${timeKey}*`];
    let count = 0;

    itemRows.forEach((row) => {
      const engineerName = row.engineer ? String(row.engineer).trim().toUpperCase() : "UNASSIGNED";
      const tower = row.towerName || "—";
      const room = row.roomName || "—";
      const itemKey = `${engineerName} // ${tower} - ${room}`;

      if (!seenItems.has(itemKey)) {
        seenItems.add(itemKey);
        count += 1;
        totalAppointments += 1;
        blockLines.push(`${count}. Handle by ${itemKey} // `);
      }
    });

    if (count > 0) {
      timeBlocks.push(blockLines.join("\n"));
    }
  });

  const headerLines = [
    `*REPORT APPOINTMENT ${clusterTitle} (${dateLabel})*`,
    // `TOTAL APPOINTMENT : ${totalAppointments}`,
  ];

  return [headerLines.join("\n"), ...timeBlocks].join("\n\n").trim();
}
