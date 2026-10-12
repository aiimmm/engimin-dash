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
 * Check if a task or its tracing schedule is rejected
 */
export function isTaskRejected(row = {}) {
  const traceStatus = String(
    row.reservationtraces_status ||
      row.reservationtrace_status ||
      row.traces_status ||
      row.engineer_status ||
      "",
  )
    .trim()
    .toLowerCase();

  const mainStatus = String(row.status || row.wo_status || "")
    .trim()
    .toLowerCase();

  if (traceStatus === "rejected" || mainStatus === "rejected") {
    return true;
  }

  // Check inside tracingSchedule array if present
  const tracing = Array.isArray(row.tracingSchedule)
    ? row.tracingSchedule
    : Array.isArray(row.tracing_schedule)
      ? row.tracing_schedule
      : [];

  const hasTracingRejected = tracing.some((item) => {
    const st = String(item?.status || item?.reservationtraces_status || "")
      .trim()
      .toLowerCase();
    return st === "rejected";
  });

  return hasTracingRejected;
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
  if (isTaskRejected(row)) return false;

  const tracing = Array.isArray(row.tracingSchedule)
    ? row.tracingSchedule
    : Array.isArray(row.tracing_schedule)
      ? row.tracing_schedule
      : [];

  const rootStatus = String(row.status || "")
    .trim()
    .toLowerCase();
  const rootWoStatus = String(row.wo_status || "")
    .trim()
    .toLowerCase();
  const rootTraceStatus = String(row.reservationtraces_status || "")
    .trim()
    .toLowerCase();

  // If the reservation trace or schedule is still "New", it is not yet done by engineer
  if (rootTraceStatus === "new") {
    return false;
  }

  // Done by Eng is true when the engineer/tracing schedule is completed or WO is completed
  const hasTracingCompleted = tracing.some(
    (t) =>
      String(t?.status || "")
        .trim()
        .toLowerCase() === "completed",
  );
  const isTraceCompleted = rootTraceStatus === "completed" || hasTracingCompleted;
  const isWoCompleted = rootWoStatus === "completed" || rootStatus === "completed";

  return isTraceCompleted || isWoCompleted;
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
  const isRejected = isTaskRejected(row);
  const isDoneByEng = isTaskDoneByEng(row);
  const isDoneByAdmin = isTaskDoneByAdmin(row);

  // Parts building for text copy
  const parts = [time, woTypeTitle, woNo, location, `GenID: ${genId}`, inHouseStatus];

  if (isGuestAppt) {
    parts.push("Guest Appointment");
  }

  if (isRejected) {
    parts.push("Rejected");
  } else if (isDoneByEng) {
    parts.push("Done by Eng");
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
    isRejected,
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

  const titleHeader = `CLUSTER ${clusterStr}\nENGINEERING SCHEDULES ${dateRangeStr}`.trim();

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
      resultBlocks.push(`${group.engineerName} | ${count} Rows\n${unitsList}`);
    }
  });

  if (!resultBlocks.length) {
    return `${titleHeader}\n\nTidak ada unit Non In-House ditemukan.`;
  }

  return [titleHeader, ...resultBlocks].join("\n\n").trim();
}
