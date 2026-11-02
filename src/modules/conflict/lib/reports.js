// ============================================================================
// LIB / API — /dashboard/conflict (Report Generator)
// Purpose: WhatsApp text report generator for conflict work orders
// Description: Formats overall and per-DIC stats with clean text headers and blank line spacing
// ============================================================================

import { formatCompactDate } from "@/modules/appointment/lib";
import {
  getDepartmentCategory,
  getRoomStatusCategory,
  today,
} from "@/modules/shared/work-orders/lib";

function isAssignedEngineer(row) {
  const eng = String(row?.engineer ?? "")
    .trim()
    .toLowerCase();
  return Boolean(eng && eng !== "—" && eng !== "-" && !eng.includes("unassigned"));
}

function isActionDateToday(row, todayStr = today()) {
  if (!row?.actionDate) return false;
  const str = String(row.actionDate).trim();
  if (str.startsWith(todayStr)) return true;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` === todayStr;
  }
  const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}` === todayStr;
  }
  return false;
}

function isCloseOutRow(row) {
  if (row?.isIncludeCloseOut !== undefined && row?.isIncludeCloseOut !== null) {
    const val = Number(row.isIncludeCloseOut);
    if (!isNaN(val)) return val === 1;
    return (
      String(row.isIncludeCloseOut).toLowerCase() === "true" ||
      String(row.isIncludeCloseOut) === "1"
    );
  }
  const closeOut = row?.closeOutDate;
  if (closeOut && closeOut !== "—" && closeOut !== "-") return true;
  const status = String(row?.woStatus || row?.status || "").toLowerCase();
  return status === "completed" || status === "complete" || status === "closed" || status === "3";
}

function computeMetrics(rows = [], todayStr = today()) {
  let assignedAll = 0;
  let unassignedAll = 0;
  let assignedToday = 0;
  let unassignedToday = 0;
  let minor = 0;
  let major = 0;
  let closeOut = 0;

  rows.forEach((row) => {
    const assigned = isAssignedEngineer(row);
    if (assigned) {
      assignedAll += 1;
    } else {
      unassignedAll += 1;
    }

    const todayMatch = isActionDateToday(row, todayStr);
    if (todayMatch) {
      if (assigned) {
        assignedToday += 1;
      } else {
        unassignedToday += 1;
      }
    }

    const roomCat = getRoomStatusCategory(row?.roomStatus);
    if (roomCat === "Minor") minor += 1;
    else if (roomCat === "Major") major += 1;

    if (isCloseOutRow(row)) {
      closeOut += 1;
    }
  });

  return {
    total: rows.length,
    assignedAll,
    unassignedAll,
    assignedToday,
    unassignedToday,
    minor,
    major,
    closeOut,
  };
}

/**
 * Generate Report Conflict for All Clusters or specific cluster(s).
 */
export function generateConflictReport(rows = [], options = {}) {
  const { selectedClusters = [], dateRange = {}, date = "" } = options;
  let clusterTitleHeader = "REPORT ALL CLUSTER";
  if (selectedClusters.length > 0) {
    const clustersText = selectedClusters.map((c) => String(c).trim().toUpperCase()).join(", ");
    clusterTitleHeader = `REPORT CLUSTER ${clustersText}`;
  }

  const fromDate = dateRange?.from || date;
  const toDate = dateRange?.to || date;
  const fromLabel = fromDate ? formatCompactDate(fromDate) : "";
  const toLabel = toDate && toDate !== fromDate ? formatCompactDate(toDate) : "";
  const rangeLabel =
    fromLabel && toLabel ? ` (${fromLabel} - ${toLabel})` : fromLabel ? ` (${fromLabel})` : "";

  const todayStr = today();
  const overall = computeMetrics(rows, todayStr);

  const sections = [];

  const overallLines = [
    clusterTitleHeader,
    `WO CONFLICT DATES${rangeLabel}`,
    `-> Total Conflict Dates : ${overall.total}`,
    `-> Total Assigned All : ${overall.assignedAll}`,
    `-> Total Unassigned All : ${overall.unassignedAll}`,
    `-> Total Assigned Today : ${overall.assignedToday}`,
    `-> Total Unassigned Today : ${overall.unassignedToday}`,
    `-> Total Room Status Minor : ${overall.minor}`,
    `-> Total Room Status Major : ${overall.major}`,
    `-> Total Close Out : ${overall.closeOut}`,
  ];
  sections.push(overallLines.join("\n"));

  const dicDefinitions = [
    {
      title: "DIC Engineering",
      filter: (r) => getDepartmentCategory(r?.department) === "Engineering",
    },
    {
      title: "DIC Operational (OPS)",
      filter: (r) => getDepartmentCategory(r?.department) === "Operational",
    },
    {
      title: "DIC Traveliomart",
      filter: (r) => getDepartmentCategory(r?.department) === "Traveliomart",
    },
    {
      title: "DIC Admin Inventory",
      filter: (r) => getDepartmentCategory(r?.department) === "Admin Inventory",
    },
    {
      title: "DIC Customer Service (CS)",
      filter: (r) => getDepartmentCategory(r?.department) === "CS",
    },
    {
      title: "DIC Owner Relationship Management (ORM)",
      filter: (r) => getDepartmentCategory(r?.department) === "ORM",
    },
    {
      title: "DIC Technical Auditor (TA)",
      filter: (r) => getDepartmentCategory(r?.department) === "Technical Auditor",
    },
    {
      title: "DIC Unassigned (-)",
      filter: (r) => {
        const cat = getDepartmentCategory(r?.department);
        return ![
          "Engineering",
          "Operational",
          "Traveliomart",
          "Admin Inventory",
          "CS",
          "ORM",
          "Technical Auditor",
        ].includes(cat);
      },
    },
  ];

  dicDefinitions.forEach(({ title, filter }) => {
    const dicRows = rows.filter(filter);
    const m = computeMetrics(dicRows, todayStr);
    const dicLines = [
      title,
      `-> Total : ${m.total}`,
      `-> Total Assigned All : ${m.assignedAll}`,
      `-> Total Unassigned All : ${m.unassignedAll}`,
      `-> Total Assigned Today : ${m.assignedToday}`,
      `-> Total Unassigned Today : ${m.unassignedToday}`,
      `-> Total Room Status Minor : ${m.minor}`,
      `-> Total Room Status Major : ${m.major}`,
      `-> Total Close Out : ${m.closeOut}`,
    ];
    sections.push(dicLines.join("\n"));
  });

  return sections.join("\n\n");
}
