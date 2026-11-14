import { today, tomorrow } from "@/modules/shared/work-orders/lib";

/**
 * Format date to DD/MM/YYYY (e.g. 20/09/2026)
 */
export function formatCompactDate(dateInput) {
  if (!dateInput) {
    const tStr = tomorrow();
    const isoMatch = tStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
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
 * Extract time from action_date / actionDate string, formatted as HH:mm (e.g. "11:30" or "00:00")
 */
export function extractActionTime(actionDate) {
  if (!actionDate) return "00:00";
  const str = String(actionDate).trim();
  const timeMatch = str.match(/(?:T|\s)(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }
  return "00:00";
}

/**
 * Check if a row is a timed / guest appointment task
 */
export function isAppointmentTask(row) {
  const isGuestAppt =
    String(row.is_guestAppointment || row.isGuestAppointment || "")
      .trim()
      .toLowerCase() === "yes" ||
    row.is_guestAppointment === 1 ||
    row.is_guestAppointment === true;

  const time = extractActionTime(row.action_date || row.actionDate);
  const hasSpecificTime = time !== "00:00";

  return isGuestAppt || hasSpecificTime;
}

/**
 * Extract task tracking status info for Allocation
 * Handles 6 statuses:
 * - "New"
 * - "Arrived"
 * - "Pending"
 * - "Completed" (Done by Eng)
 * - "Rejected"
 * - "Rejected WO Guarantee"
 */
export function getTaskTrackingStatus(row = {}) {
  const traceStatus = String(
    row.reservationtraces_status ||
      row.reservationtrace_status ||
      row.traces_status ||
      row.engineer_status ||
      "",
  ).trim();

  const mainStatus = String(row.status || row.wo_status || "").trim();

  const tracing = Array.isArray(row.tracingSchedule)
    ? row.tracingSchedule
    : Array.isArray(row.tracing_schedule)
      ? row.tracing_schedule
      : [];

  const tracingStatus =
    tracing
      .map((t) => String(t?.status || t?.reservationtraces_status || "").trim())
      .find(Boolean) || "";

  const rejectDate =
    row.rejected_wo_guarantee_date &&
    row.rejected_wo_guarantee_date !== "—" &&
    row.rejected_wo_guarantee_date !== "-"
      ? row.rejected_wo_guarantee_date
      : null;

  // Check Rejected WO Guarantee first (most specific)
  const isRejectedGuarantee =
    Boolean(rejectDate) ||
    /rejected\s+wo\s+guarantee/i.test(traceStatus) ||
    /rejected\s+wo\s+guarantee/i.test(mainStatus) ||
    tracing.some(
      (t) =>
        (Boolean(t?.rejected_wo_guarantee_date) &&
          t?.rejected_wo_guarantee_date !== "—" &&
          t?.rejected_wo_guarantee_date !== "-") ||
        /rejected\s+wo\s+guarantee/i.test(String(t?.status || "")),
    );

  if (isRejectedGuarantee) {
    return {
      status: "Rejected WO Guarantee",
      isRejected: true,
      isRejectedGuarantee: true,
      isCompleted: false,
      isPending: false,
      isArrived: false,
      isNew: false,
      tone: "red",
    };
  }

  // Check Rejected (general)
  const isRejectedGeneral =
    /rejected/i.test(traceStatus) ||
    /rejected/i.test(mainStatus) ||
    tracing.some((t) => /rejected/i.test(String(t?.status || "")));

  if (isRejectedGeneral) {
    return {
      status: "Rejected",
      isRejected: true,
      isRejectedGuarantee: false,
      isCompleted: false,
      isPending: false,
      isArrived: false,
      isNew: false,
      tone: "red",
    };
  }

  // Check Arrived
  const isArrived =
    /arrived/i.test(traceStatus) ||
    /arrived/i.test(mainStatus) ||
    tracing.some((t) => /arrived/i.test(String(t?.status || "")));

  if (isArrived) {
    return {
      status: "Arrived",
      isRejected: false,
      isRejectedGuarantee: false,
      isCompleted: false,
      isPending: false,
      isArrived: true,
      isNew: false,
      tone: "blue",
    };
  }

  // Check Pending
  const isPending =
    /pending/i.test(traceStatus) ||
    /pending/i.test(mainStatus) ||
    tracing.some((t) => /pending/i.test(String(t?.status || "")));

  if (isPending) {
    return {
      status: "Pending",
      isRejected: false,
      isRejectedGuarantee: false,
      isCompleted: false,
      isPending: true,
      isArrived: false,
      isNew: false,
      tone: "amber",
    };
  }

  // Check Completed (Done by Eng)
  const isCompleted =
    /completed/i.test(traceStatus) ||
    /completed/i.test(mainStatus) ||
    tracing.some((t) => /completed/i.test(String(t?.status || "")));

  if (isCompleted) {
    return {
      status: "Completed",
      isRejected: false,
      isRejectedGuarantee: false,
      isCompleted: true,
      isPending: false,
      isArrived: false,
      isNew: false,
      tone: "emerald",
    };
  }

  // Default / New
  return {
    status: "New",
    isRejected: false,
    isRejectedGuarantee: false,
    isCompleted: false,
    isPending: false,
    isArrived: false,
    isNew: true,
    tone: "neutral",
  };
}

/**
 * Check if a task or its tracing schedule is rejected (including Rejected WO Guarantee)
 */
export function isTaskRejected(row = {}) {
  const tracking = getTaskTrackingStatus(row);
  return tracking.isRejected;
}

/**
 * Determine in-house status based on roomStatusName / room_status
 * "Vacant" -> "Non In-House"
 * "Occupied" -> "In-House"
 */
export function getInHouseStatus(roomStatusName) {
  const str = String(roomStatusName || "").toLowerCase();
  if (str.includes("occupied")) return "In-House";
  if (str.includes("vacant")) return "Non In-House";
  return "Non In-House";
}

/**
 * Check if a task is Done by Eng
 */
export function isTaskDoneByEng(row = {}) {
  const tracking = getTaskTrackingStatus(row);
  return tracking.isCompleted;
}

/**
 * Check if a task is Done by Admin
 */
export function isTaskDoneByAdmin(row = {}) {
  const tracing = Array.isArray(row.tracingSchedule)
    ? row.tracingSchedule
    : Array.isArray(row.tracing_schedule)
      ? row.tracing_schedule
      : [];

  const adminCompletedDate =
    row.completed_date || tracing.find((t) => Boolean(t?.completed_date))?.completed_date;
  return Boolean(adminCompletedDate);
}

/**
 * Extract single row WhatsApp format line and structured components for UI rendering
 */
export function formatAllocationRow(row) {
  const time = extractActionTime(row.action_date || row.actionDate);
  const subtype = row.subtype || row.subType || row.type || "WO";
  const articles = row.articles || row.article || "—";
  const woTypeTitle = `WO ${subtype} - ${articles}`;
  const woNo = row.wo_no || row.woNumber || row.code || "—";

  // Property formatting: "towername - roomnumber" or "towername, roomnumber"
  const tower = row.towername || row.towerName || "";
  const roomNum = row.roomnumber || row.roomName || row.roomname || "";
  let location = "";
  if (tower && roomNum) {
    location = `${tower} - ${roomNum}`;
  } else {
    location = tower || roomNum || "—";
  }

  const genId = row.roomcode || row.roomCode || row.genId || "—";
  const inHouseStatus = getInHouseStatus(row.roomStatusName || row.roomStatus);

  // is_guestAppointment check ("yes" / "1" / true)
  const isGuestAppt =
    String(row.is_guestAppointment || row.isGuestAppointment || "")
      .trim()
      .toLowerCase() === "yes" ||
    row.is_guestAppointment === 1 ||
    row.is_guestAppointment === true;

  // Status checks
  const trackingStatus = getTaskTrackingStatus(row);
  const isRejected = trackingStatus.isRejected;
  const isDoneByEng = isTaskDoneByEng(row);
  const isDoneByAdmin = isTaskDoneByAdmin(row);

  // Parts building for text copy
  const parts = [time, woTypeTitle, woNo, location, `GenID: ${genId}`, inHouseStatus];

  if (isGuestAppt) {
    parts.push("Guest Appointment");
  }

  // Include tracking status if not "New"
  if (trackingStatus.status === "Rejected WO Guarantee") {
    parts.push("Rejected WO Guarantee");
  } else if (trackingStatus.status === "Rejected") {
    parts.push("Rejected");
  } else if (trackingStatus.status === "Completed") {
    parts.push("Done by Eng");
  } else if (trackingStatus.status === "Arrived") {
    parts.push("Arrived");
  } else if (trackingStatus.status === "Pending") {
    parts.push("Pending");
  }

  if (isDoneByAdmin) {
    parts.push("Done by Admin");
  }

  const mainLine = parts.join(" || ");
  const noteLine = `Note: ${row.note || row.remark || "—"}`;

  return {
    time,
    woTypeTitle,
    woNo,
    location,
    genId,
    inHouseStatus,
    isGuestAppt,
    trackingStatus,
    taskStatus: trackingStatus.status,
    isRejected,
    isRejectedGuarantee: trackingStatus.isRejectedGuarantee,
    isArrived: trackingStatus.isArrived,
    isPending: trackingStatus.isPending,
    isDoneByEng,
    isDoneByAdmin,
    rawRow: row,
    mainLine,
    noteLine,
    fullText: `${mainLine}\n${noteLine}`,
  };
}

/**
 * Group allocation items by engineer and sort engineers A-Z.
 * Inside each engineer's list:
 * - Timed tasks / guest appointments come first (sorted descending from 23:00 downwards: e.g. 16:00 before 10:30)
 * - Non-appointment / regular tasks follow after
 */
export function groupAllocationByEngineer(items = []) {
  const engineerGroups = new Map();

  items.forEach((item) => {
    const rawEng =
      item.engineer_1 || item.engineer || item.currentEngineerName || item.fullname || "UNASSIGNED";
    const engKey = String(rawEng).trim().toUpperCase();

    if (!engineerGroups.has(engKey)) {
      engineerGroups.set(engKey, []);
    }
    engineerGroups.get(engKey).push(item);
  });

  const sortedEngineers = [...engineerGroups.keys()].sort((a, b) => a.localeCompare(b));

  return sortedEngineers.map((engName) => {
    const rawRows = engineerGroups.get(engName);

    // Sort rows for this engineer:
    // 1. Appointment / timed tasks first (sorted descending by time: 23:00 -> 00:01)
    // 2. Regular tasks next
    const sortedRows = [...rawRows].sort((a, b) => {
      const isApptA = isAppointmentTask(a);
      const isApptB = isAppointmentTask(b);

      if (isApptA && !isApptB) return -1;
      if (!isApptA && isApptB) return 1;

      if (isApptA && isApptB) {
        const timeA = extractActionTime(a.action_date || a.actionDate);
        const timeB = extractActionTime(b.action_date || b.actionDate);
        // Descending order (e.g. 16:00 before 10:30)
        return timeB.localeCompare(timeA);
      }

      return 0;
    });

    const rowCount = sortedRows.length;
    const header = `${engName} | ${rowCount} row(s)`;
    const formattedRows = sortedRows.map(formatAllocationRow);

    return {
      engineerName: engName,
      header,
      rowCount,
      rows: sortedRows,
      formattedRows,
    };
  });
}

/**
 * Generate full text WhatsApp report
 */
export function generateAllocationReport(items = [], options = {}) {
  const { date = "", selectedClusters = [] } = options;
  const dateLabel = formatCompactDate(date || tomorrow());
  const grouped = groupAllocationByEngineer(items);

  const clusterLabel =
    selectedClusters.length > 0 ? ` - Cluster ${selectedClusters.join(", ")}` : "";
  const titleHeader = `Engineering Schedules${clusterLabel} (${dateLabel})`;

  if (!grouped.length) {
    return `${titleHeader}\n\nTidak ada jadwal alokasi ditemukan.`;
  }

  const engineerBlocks = grouped.map((group) => {
    const rowTexts = group.formattedRows.map((r) => r.fullText);
    return [group.header, ...rowTexts].join("\n");
  });

  return [titleHeader, ...engineerBlocks].join("\n\n").trim();
}

/**
 * Format Date to Day, DD-MM-YYYY (e.g. Saturday, 03-10-2026)
 */
export function formatFullDayDate(dateInput) {
  if (!dateInput) return "";
  const str = String(dateInput).trim();

  let dateObj;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else {
    dateObj = new Date(dateInput);
  }

  if (isNaN(dateObj.getTime())) return str;

  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);
  const dayNum = String(dateObj.getDate()).padStart(2, "0");
  const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yearNum = dateObj.getFullYear();

  return `${dayName}, ${dayNum}-${monthNum}-${yearNum}`;
}

/**
 * Generate report for picking up keys for non in-house units grouped by engineer without duplicates
 */
export function generateNonInHouseKeyPickupReport(items = [], options = {}) {
  const { dateRange = {}, selectedClusters = [] } = options;

  const clusterStr = (
    selectedClusters.length > 0 ? selectedClusters.join(", ") : "ALL CLUSTERS"
  ).toUpperCase();

  const fromFormatted = formatFullDayDate(dateRange?.from);
  const toFormatted = formatFullDayDate(dateRange?.to || dateRange?.from);
  const dateRangeStr =
    fromFormatted && toFormatted
      ? `[${fromFormatted} - ${toFormatted}]`
      : fromFormatted
        ? `[${fromFormatted}]`
        : "";

  const titleHeader = `*CLUSTER ${clusterStr}*\n*ENGINEERING SCHEDULES ${dateRangeStr}*`.trim();

  const grouped = groupAllocationByEngineer(items);
  const resultBlocks = [];

  grouped.forEach((group) => {
    // Collect unique non in-house locations for this engineer
    const uniqueLocations = new Set();

    group.formattedRows.forEach((r) => {
      if (r.inHouseStatus === "Non In-House") {
        const unitString = `- ${r.location}`;
        uniqueLocations.add(unitString);
      }
    });

    if (uniqueLocations.size > 0) {
      const count = uniqueLocations.size;
      const unitsList = Array.from(uniqueLocations).join("\n");
      resultBlocks.push(`*${group.engineerName} | ${count} Rows*\n${unitsList}`);
    }
  });

  if (!resultBlocks.length) {
    return `${titleHeader}\n\nTidak ada unit Non In-House ditemukan.`;
  }

  return [titleHeader, ...resultBlocks].join("\n\n").trim();
}
