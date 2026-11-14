// ============================================================================
// LIB / MODULE — /dashboard/settings (Excel Exporter)
// Purpose: Excel (.xlsx) file generation with styling for Required WO and All Modules
// Description: Maps work orders rows into formatted Excel cells with autofilter
// ============================================================================

import {
  REQUIRED_WO_SHEET_HEADERS,
  formatRequiredWoDataForSheet,
} from "@/lib/services/required-wo-sheet";
import { toTitleCase } from "@/lib/utils";
import * as XLSXStyle from "xlsx-js-style";

const HEADER_FILL_COLOR = "0F172A"; // Slate-900
const HEADER_FONT_COLOR = "FFFFFF";
const BORDER_COLOR = "CBD5E1";
const MIN_COLUMN_WIDTH = 10;
const COLUMN_WIDTH_PADDING = 4;

const border = {
  top: { style: "thin", color: { rgb: BORDER_COLOR } },
  bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
  left: { style: "thin", color: { rgb: BORDER_COLOR } },
  right: { style: "thin", color: { rgb: BORDER_COLOR } },
};

const headerCellStyle = {
  font: { name: "Arial", sz: 10, bold: true, color: { rgb: HEADER_FONT_COLOR } },
  fill: { patternType: "solid", fgColor: { rgb: HEADER_FILL_COLOR } },
  alignment: { horizontal: "center", vertical: "center", wrapText: false },
  border,
};

const dataCellStyle = (align = "left", fontColor = undefined, bgColor = undefined) => ({
  font: {
    name: "Arial",
    sz: 9,
    ...(fontColor ? { color: { rgb: fontColor }, bold: true } : {}),
  },
  ...(bgColor ? { fill: { patternType: "solid", fgColor: { rgb: bgColor } } } : {}),
  alignment: { vertical: "center", horizontal: align, wrapText: false },
  border,
});

function toCell(value, style) {
  const displayVal = typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : (value ?? "");
  return {
    v: displayVal,
    t: typeof value === "number" ? "n" : "s",
    s: style,
  };
}

function longestLineLength(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .reduce((max, line) => Math.max(max, line.length), 0);
}

/**
 * Export Required Work Orders (Appointment + CI Conflict + Aging) to Excel (.xlsx)
 * Uses the exact 13 columns matching Google Sheets specification.
 */
export function exportRequiredWoExcel({
  appointmentRows = [],
  conflictRows = [],
  agingRows = [],
  baseDate = "",
  filename = "",
}) {
  const formatted = formatRequiredWoDataForSheet([], {
    date: baseDate,
    appointmentRows,
    conflictRows,
    agingRows,
  });

  const headers = formatted.headers || REQUIRED_WO_SHEET_HEADERS;
  const rows = formatted.rows || [];

  const headerRow = headers.map((h) => toCell(h, headerCellStyle));

  const dataRows = rows.map((row) =>
    row.map((cellVal, colIdx) => {
      let align = "left";
      let fontColor = undefined;
      let bgColor = undefined;

      if (
        colIdx === 0 || // No.
        colIdx === 1 || // Category
        colIdx === 4 || // BookingID
        colIdx === 5 || // Check-In Date
        colIdx === 6 || // Check-Out Date
        colIdx === 7 || // Action Date
        colIdx === 8 || // GenID
        colIdx === 9 || // Unit
        colIdx === 10 || // Engineer
        colIdx === 11 || // DIC
        colIdx === 12 // Cluster
      ) {
        align = "center";
      }

      // 1. Pewarnaan Chip Category (Kolom C / colIdx 1)
      if (colIdx === 1) {
        const cat = String(cellVal || "").trim();
        if (cat === "Appointment") {
          bgColor = "D4EDDA";
          fontColor = "155724";
        } else if (cat === "CI Conflict") {
          bgColor = "CCE8FF";
          fontColor = "004D99";
        } else if (cat === "Aging") {
          bgColor = "FFF3CD";
          fontColor = "856404";
        }
      }

      // 2. Pewarnaan Engineer "Unassigned" (Kolom L / colIdx 10)
      if (
        colIdx === 10 &&
        String(cellVal || "")
          .trim()
          .toLowerCase() === "unassigned"
      ) {
        fontColor = "DC2626";
      }

      return toCell(cellVal, dataCellStyle(align, fontColor, bgColor));
    }),
  );

  const worksheet = XLSXStyle.utils.aoa_to_sheet([headerRow, ...dataRows]);

  worksheet["!cols"] = headers.map((h, colIdx) => {
    const longestValue = dataRows.reduce((max, r) => {
      const text = r[colIdx]?.v;
      return Math.max(max, longestLineLength(text));
    }, h.length);
    return { wch: Math.max(longestValue + COLUMN_WIDTH_PADDING, MIN_COLUMN_WIDTH) };
  });

  worksheet["!rows"] = [{ hpt: 24 }];

  const lastCol = XLSXStyle.utils.encode_col(headers.length - 1);
  worksheet["!autofilter"] = { ref: `A1:${lastCol}1` };

  const workbook = XLSXStyle.utils.book_new();
  const rawSheetName = formatted.sheetName || "Required WO";
  const safeSheetName = rawSheetName.replace(/[:\\/?*\[\]]/g, "").slice(0, 31);
  XLSXStyle.utils.book_append_sheet(workbook, worksheet, safeSheetName || "Required WO");

  const outFilename = filename || `Required_WO_${baseDate || "combined"}.xlsx`;
  XLSXStyle.writeFile(workbook, outFilename);
}

// Columns definition for generic module export
const GENERIC_MODULE_COLUMNS = [
  { header: "No.", align: "center", getValue: (row, idx) => idx + 1 },
  { header: "WO No", align: "left", getValue: (row) => row.woNumber || row.wo_no || row.id || "" },
  { header: "Note", align: "left", getValue: (row) => row.remark || row.note || "" },
  {
    header: "BookingID",
    align: "center",
    getValue: (row) =>
      row.bookingId ||
      row.booking_id ||
      row.latestReservation?.genId ||
      row.activeReservation?.genId ||
      "",
  },
  {
    header: "Action Date",
    align: "center",
    getValue: (row) => row.actionDate || row.action_date || "",
  },
  {
    header: "Created Date",
    align: "center",
    getValue: (row) => row.createdDate || row.created_date || "",
  },
  {
    header: "GenID",
    align: "center",
    getValue: (row) => row.roomCode || row.roomcode || "",
  },
  {
    header: "Unit",
    align: "center",
    getValue: (row) => [row.towerName, row.roomName].filter(Boolean).join(" — ") || row.unit || "",
  },
  {
    header: "Engineer",
    align: "center",
    getValue: (row) => (row.engineer ? toTitleCase(row.engineer) : "Unassigned"),
  },
  {
    header: "Department In Charge",
    align: "center",
    getValue: (row) => (row.department ? toTitleCase(row.department) : "Engineering"),
  },
  {
    header: "Cluster",
    align: "center",
    getValue: (row) => row.cluster || row.cluster_name || "",
  },
  {
    header: "Status",
    align: "center",
    getValue: (row) => row.status || row.wo_status || "",
  },
];

/**
 * Generic Work Orders Excel Exporter for any specific module
 */
export function exportGenericWorkOrdersExcel({
  rows = [],
  moduleTitle = "Work Orders",
  filename = "",
}) {
  const headerRow = GENERIC_MODULE_COLUMNS.map((col) => toCell(col.header, headerCellStyle));

  const dataRows = rows.map((row, idx) =>
    GENERIC_MODULE_COLUMNS.map((col) => {
      const val = col.getValue(row, idx);
      let fontColor = undefined;
      if (
        col.header === "Engineer" &&
        String(val || "")
          .trim()
          .toLowerCase() === "unassigned"
      ) {
        fontColor = "DC2626";
      }
      return toCell(val, dataCellStyle(col.align, fontColor));
    }),
  );

  const worksheet = XLSXStyle.utils.aoa_to_sheet([headerRow, ...dataRows]);

  worksheet["!cols"] = GENERIC_MODULE_COLUMNS.map((col, colIdx) => {
    const longestValue = dataRows.reduce((max, r) => {
      const text = r[colIdx]?.v;
      return Math.max(max, longestLineLength(text));
    }, col.header.length);
    return { wch: Math.max(longestValue + COLUMN_WIDTH_PADDING, MIN_COLUMN_WIDTH) };
  });

  worksheet["!rows"] = [{ hpt: 24 }];

  const lastCol = XLSXStyle.utils.encode_col(GENERIC_MODULE_COLUMNS.length - 1);
  worksheet["!autofilter"] = { ref: `A1:${lastCol}1` };

  const workbook = XLSXStyle.utils.book_new();
  const safeSheetName = String(moduleTitle)
    .replace(/[:\\/?*\[\]]/g, "")
    .slice(0, 31);
  XLSXStyle.utils.book_append_sheet(workbook, worksheet, safeSheetName || "Work Orders");

  const outFilename = filename || `${moduleTitle.toLowerCase().replace(/\s+/g, "_")}.xlsx`;
  XLSXStyle.writeFile(workbook, outFilename);
}
