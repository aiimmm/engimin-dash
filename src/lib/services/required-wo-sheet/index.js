// ============================================================================
// LIB / API — /dashboard/appointment-dates & /dashboard/conflict (Google Sheets Live Sync)
// Purpose: Formats and syncs appointment and conflict work orders to a single combined Google Sheet table via webhook
// Description: Prepares Indonesian tab names and tabular data payload for Google Sheets with Category dropdown values
// ============================================================================

import { toTitleCase } from "@/lib/utils";
import {
  checkIsBreakContract,
  isExcludedAppointmentDepartment,
  isExcludedConflictArticle,
} from "@/modules/shared/work-orders/lib";
import { addDays, format } from "date-fns";

const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const REQUIRED_WO_SHEET_HEADERS = [
  "No.",
  "Assign/Unassign",
  "Category",
  "WO",
  "Note",
  "BookingID",
  "Check-In Date",
  "Check-Out Date",
  "Action Date",
  "GenID",
  "Unit",
  "Engineer",
  "DIC",
  "Cluster",
];

export const CATEGORY_OPTIONS = ["Appointment", "CI Conflict", "Aging"];

/**
 * Calculate 1-week ahead conflict date range (e.g. from 23-09-2026 to 29-09-2026).
 * @param {string|Date} dateInput - The base appointment date (e.g. "2026-09-23")
 * @returns {{ from: string, to: string }}
 */
export function getConflictDateRangeForSync(dateInput) {
  if (!dateInput) {
    const tomorrow = addDays(new Date(), 1);
    return {
      from: format(tomorrow, "yyyy-MM-dd"),
      to: format(addDays(tomorrow, 6), "yyyy-MM-dd"),
    };
  }

  let d;
  if (typeof dateInput === "string") {
    const match = String(dateInput).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) {
    d = addDays(new Date(), 1);
  }

  const from = format(d, "yyyy-MM-dd");
  const to = format(addDays(d, 6), "yyyy-MM-dd");
  return { from, to };
}

/**
 * Get Indonesian day name for a given date.
 * @param {string|Date} dateInput
 * @returns {string} e.g. "Rabu"
 */
export function getIndonesianDayName(dateInput) {
  if (!dateInput) return "";
  let dateObj;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    const str = String(dateInput).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      dateObj = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    } else {
      dateObj = new Date(str);
    }
  }
  if (isNaN(dateObj.getTime())) return "";
  return INDONESIAN_DAYS[dateObj.getDay()] || "";
}

/**
 * Get formatted sheet name based on date (e.g. "Rabu, 09-09-2026").
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function getIndonesianSheetName(dateInput) {
  if (!dateInput) return "";
  const str = String(dateInput).trim();
  let dayName = getIndonesianDayName(str);
  let datePart = "";

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    datePart = `${match[3]}-${match[2]}-${match[1]}`;
  } else if (/^\d{8}$/.test(str)) {
    datePart = `${str.slice(6, 8)}-${str.slice(4, 6)}-${str.slice(0, 4)}`;
  } else {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      datePart = `${dd}-${mm}-${yyyy}`;
    }
  }

  if (!datePart) return "";
  return dayName ? `${dayName}, ${datePart}` : datePart;
}

/**
 * Format Check-In date string to "DD-MM-YYYY".
 * @param {string|Date} dateValue
 * @returns {string} e.g. "23-09-2026"
 */
export function formatCheckInDateForSheet(dateValue) {
  if (
    !dateValue ||
    dateValue === "—" ||
    dateValue === "-" ||
    dateValue === "null" ||
    dateValue === "undefined"
  ) {
    return "-";
  }
  const str = String(dateValue).trim();
  if (!str || str === "—" || str === "-" || str === "null" || str === "undefined") return "-";

  // Handle YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(6, 8)}-${str.slice(4, 6)}-${str.slice(0, 4)}`;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const dashMatch = str.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (dashMatch) {
    const [, yyyy, mm, dd] = dashMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return "-";
}

/**
 * Format action date string to "DD-MM-YYYY — HH:mm" without seconds.
 * @param {string|Date} dateValue
 * @returns {string} e.g. "23-09-2026 — 10:30"
 */
export function formatActionDateForSheet(dateValue) {
  if (!dateValue || dateValue === "—" || dateValue === "-") return "—";
  const str = String(dateValue).trim();

  // Handle DD/MM/YYYY or DD-MM-YYYY with optional time
  const slashMatch = str.match(
    /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (slashMatch) {
    const [, dd, mm, yyyy, hh = "00", min = "00"] = slashMatch;
    return `${dd}-${mm}-${yyyy} — ${hh}:${min}`;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD with optional time
  const dashMatch = str.match(
    /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (dashMatch) {
    const [, yyyy, mm, dd, hh = "00", min = "00"] = dashMatch;
    return `${dd}-${mm}-${yyyy} — ${hh}:${min}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} — ${hh}:${min}`;
  }

  return str;
}

/**
 * Format a single work order row for the spreadsheet payload.
 * Columns: No., WO, Note, BookingID, Check-In Date, Action Date, GenID, Unit, Category, Engineer, DIC, Cluster
 * @param {Object} row
 * @param {string} category e.g. "Appointment" or "CI Conflict"
 * @param {number} indexNumber
 * @returns {Array}
 */
export function formatWorkOrderRowForSheet(row, category = "Appointment", indexNumber = 1) {
  const reservation =
    row.booking || row.activeReservation || row.latestReservation || row.futureReservation;

  const bookingId =
    reservation?.genId ||
    row.otaBookNumber ||
    row.ota_book_number ||
    row.genId ||
    row.gen_id ||
    "—";

  const rawCiDate = reservation?.formattedCheckinDate || row.formattedCheckinDate || "";
  const checkInDate = formatCheckInDateForSheet(rawCiDate);

  const rawCoDate = reservation?.formattedCheckoutDate || row.formattedCheckoutDate || "";
  const checkOutDate = formatCheckInDateForSheet(rawCoDate);

  const actionDate = formatActionDateForSheet(row.actionDate || row.action_date || "");
  const genId = row.roomCode || row.roomcode || row.room_code || "—";
  const unit = [row.towerName, row.roomName].filter(Boolean).join(" — ") || "—";

  const rawNote = row.remark || row.note || "—";
  const note = String(rawNote)
    .replace(/[\r\n]+/g, " ")
    .trim();

  const rawEngineer = row.engineer ? String(row.engineer).trim() : "";
  const isAssigned = Boolean(
    rawEngineer &&
    rawEngineer.toLowerCase() !== "unassigned" &&
    rawEngineer !== "-" &&
    rawEngineer !== "—",
  );
  const engineer = isAssigned ? toTitleCase(rawEngineer) : "Unassigned";
  const dic = row.department ? toTitleCase(row.department) : "Engineering";
  const cluster = row.cluster || "—";

  return [
    indexNumber, // 1. No.
    isAssigned, // 2. Assign/Unassign (Checkbox: true/false)
    category, // 3. Category (Dropdown: Appointment, CI Conflict, Aging)
    row.woNumber || row.wo_no || row.id || "—", // 4. WO
    note, // 5. Note
    bookingId, // 6. BookingID
    checkInDate, // 7. Check-In Date ("DD-MM-YYYY")
    checkOutDate, // 8. Check-Out Date ("DD-MM-YYYY")
    actionDate, // 9. Action Date ("DD-MM-YYYY — HH:mm")
    genId, // 10. GenID
    unit, // 11. Unit
    engineer, // 12. Engineer
    dic, // 13. DIC
    cluster, // 14. Cluster
  ];
}

export function isBreakContractRow(row = {}) {
  if (row.isBreakContract !== undefined && typeof row.isBreakContract === "boolean") {
    return row.isBreakContract;
  }
  const dateVal =
    row.breakContractDate ||
    row.breakcontract_date ||
    row.break_contract_date ||
    row.breakcontractDate;
  return checkIsBreakContract(dateVal);
}

/**
 * Format combined appointment, conflict, and aging work orders into a single tabular structured payload.
 * Structure: Category "Appointment" first, followed by "CI Conflict", followed by "Aging".
 * Columns: No., WO, Note, BookingID, Check-In Date, Action Date, GenID, Unit, Category, Engineer, DIC, Cluster
 * @param {Array} rows - Default appointment rows or all rows
 * @param {Object} options - { date, appointmentRows, conflictRows, agingRows }
 * @returns {Object}
 */
export function formatRequiredWoDataForSheet(rows = [], options = {}) {
  const { date = "", appointmentRows, conflictRows, agingRows } = options;
  const sheetName = getIndonesianSheetName(date);

  const rawAppointmentRows =
    appointmentRows !== undefined ? appointmentRows : Array.isArray(rows) ? rows : [];

  const finalAppointmentRows = rawAppointmentRows.filter(
    (row) => !isExcludedAppointmentDepartment(row.department),
  );

  const finalConflictRows = (conflictRows !== undefined ? conflictRows : []).filter(
    (row) => !isExcludedConflictArticle(row.article),
  );

  const finalAgingRows = (agingRows !== undefined ? agingRows : []).filter(
    (row) => !isExcludedConflictArticle(row.article),
  );

  let currentNo = 1;

  // Helper to extract timestamp for sorting
  const getSortTimestamp = (row) => {
    const reservation = row.activeReservation || row.latestReservation || row.futureReservation;
    const rawCiDate =
      row.ciDate ||
      row.checkinDate ||
      row.checkInDate ||
      reservation?.checkinDate ||
      reservation?.ciDate ||
      row.actionDate ||
      row.action_date ||
      "";
    if (!rawCiDate) return 0;
    const d = new Date(rawCiDate);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // 1. Format Appointment rows first
  const formattedAppointmentRows = finalAppointmentRows.map((row) =>
    formatWorkOrderRowForSheet(row, "Appointment", currentNo++),
  );

  // 2. Sort CI Conflict rows by date ascending (from earliest day to latest day of the week)
  const sortedConflictRows = [...finalConflictRows].sort((a, b) => {
    const timeA = getSortTimestamp(a);
    const timeB = getSortTimestamp(b);
    return timeA - timeB;
  });

  // 3. Format CI Conflict rows below Appointment rows
  const formattedConflictRows = sortedConflictRows.map((row) =>
    formatWorkOrderRowForSheet(row, "CI Conflict", currentNo++),
  );

  // 4. Format Aging rows below CI Conflict rows
  const formattedAgingRows = finalAgingRows.map((row) =>
    formatWorkOrderRowForSheet(row, "Aging", currentNo++),
  );

  const combinedRows = [
    ...formattedAppointmentRows,
    ...formattedConflictRows,
    ...formattedAgingRows,
  ];

  return {
    spreadsheetName:
      process.env.REQUIRED_WO_SHEET_NAME || process.env.APPOINTMENT_SHEET_NAME || "Required WO",
    sheetName,
    date,
    headers: REQUIRED_WO_SHEET_HEADERS,
    totalRows: combinedRows.length,
    appointmentCount: formattedAppointmentRows.length,
    conflictCount: formattedConflictRows.length,
    agingCount: formattedAgingRows.length,
    rows: combinedRows,
    categories: CATEGORY_OPTIONS,
    dropdownOptions: {
      Category: CATEGORY_OPTIONS,
    },
  };
}

/**
 * Sync combined appointment, conflict, and aging data to Google Sheet via webhook.
 * @param {Object} params - { rows, appointmentRows, conflictRows, agingRows, date }
 * @returns {Promise<Object>}
 */
export async function syncRequiredWorkorderToGoogleSheet({
  rows = [],
  appointmentRows,
  conflictRows,
  agingRows,
  date = "",
}) {
  const webhookUrl = process.env.REQUIRED_WO_SHEET_WEBHOOK_URL;

  const payload = formatRequiredWoDataForSheet(rows, {
    date,
    appointmentRows,
    conflictRows,
    agingRows,
  });

  const now = new Date();
  const timestamp = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  payload.syncedAt = timestamp;

  if (!webhookUrl) {
    return {
      success: true,
      configured: false,
      message:
        "Sync payload prepared. Configure REQUIRED_WO_SHEET_WEBHOOK_URL to enable live Google Sheets sync.",
      data: payload,
    };
  }

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 45000) : null;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const jsonRes = await res.json().catch(() => null);

    if (jsonRes && jsonRes.status === "error") {
      return {
        success: false,
        configured: true,
        error: jsonRes.message || "Apps Script returned an error",
        data: payload,
      };
    }

    return {
      success: res.ok,
      configured: true,
      status: res.status,
      data: payload,
    };
  } catch (error) {
    return {
      success: false,
      configured: true,
      error: error.message || "Failed to sync to Google Sheets webhook",
      data: payload,
    };
  }
}
