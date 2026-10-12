// ============================================================================
// LIB / API — /dashboard/action-dates & Shared Work Orders (Excel Exporter)
// Purpose: Excel (.xlsx) file generation with styling for Work Orders lists
// Description: Maps work orders rows into formatted Excel cells with autofilter
// ============================================================================

import { toTitleCase } from "@/lib/utils";
import * as XLSXStyle from "xlsx-js-style";

const HEADER_FILL_COLOR = "0A0A0A";
const HEADER_FONT_COLOR = "FFFFFF";
const BORDER_COLOR = "D9D9D9";
const MIN_COLUMN_WIDTH = 8;
const COLUMN_WIDTH_PADDING = 4;

// Kolom yang diekspor, sesuai urutan dan penamaan yang diminta.
const EXPORT_COLUMNS = [
  // TAMBAHAN: Kolom Nomor Urut
  { header: "No.", align: "center", getValue: (row, index) => index + 1 },

  { header: "WO", align: "left", getValue: (row) => row.woNumber || "" },
  { header: "Note", align: "left", getValue: (row) => row.remark || "" },
  {
    header: "BookingID",
    align: "center",
    getValue: (row) => row.latestReservation?.genId || row.activeReservation?.genId || "",
  },
  { header: "Action Date", align: "center", getValue: (row) => row.actionDate || "" },
  { header: "GenID", align: "center", getValue: (row) => row.roomCode || "" },
  {
    header: "Unit",
    align: "center",
    getValue: (row) => [row.towerName, row.roomName].filter(Boolean).join(" — "),
  },
  {
    header: "Engineer",
    align: "center",
    getValue: (row) => (row.engineer ? toTitleCase(row.engineer) : ""),
  },
  {
    header: "Department In Charge",
    align: "center",
    getValue: (row) => (row.department ? toTitleCase(row.department) : ""),
  },
  { header: "Cluster", align: "center", getValue: (row) => row.cluster || "" },
];

const border = {
  top: { style: "thin", color: { rgb: BORDER_COLOR } },
  bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
  left: { style: "thin", color: { rgb: BORDER_COLOR } },
  right: { style: "thin", color: { rgb: BORDER_COLOR } },
};

const headerCellStyle = {
  font: { name: "Arial", sz: 11, bold: true, color: { rgb: HEADER_FONT_COLOR } },
  fill: { patternType: "solid", fgColor: { rgb: HEADER_FILL_COLOR } },
  alignment: { horizontal: "center", vertical: "center", wrapText: false },
  border,
};

const dataCellStyle = (align) => ({
  font: { name: "Arial", sz: 10 },
  alignment: { vertical: "center", horizontal: align, wrapText: false },
  border,
});

function toCell(value, style) {
  return { v: value === undefined || value === null ? "" : value, t: "s", s: style };
}

function longestLineLength(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .reduce((max, line) => Math.max(max, line.length), 0);
}

export function exportWorkOrdersToExcel(rows, filename) {
  const headerRow = EXPORT_COLUMNS.map((column) => toCell(column.header, headerCellStyle));

  // PERUBAHAN: Menambahkan rowIndex pada map agar bisa dipakai untuk nomor urut
  const dataRows = rows.map((row, rowIndex) =>
    EXPORT_COLUMNS.map((column) =>
      toCell(column.getValue(row, rowIndex), dataCellStyle(column.align)),
    ),
  );

  const worksheet = XLSXStyle.utils.aoa_to_sheet([headerRow, ...dataRows]);

  worksheet["!cols"] = EXPORT_COLUMNS.map((column, columnIndex) => {
    const longestValue = dataRows.reduce((max, dataRow) => {
      const text = dataRow[columnIndex]?.v;
      return Math.max(max, longestLineLength(text));
    }, column.header.length);
    return { wch: Math.max(longestValue + COLUMN_WIDTH_PADDING, MIN_COLUMN_WIDTH) };
  });

  worksheet["!rows"] = [{ hpt: 22 }];

  const lastColumnLetter = XLSXStyle.utils.encode_col(EXPORT_COLUMNS.length - 1);
  worksheet["!autofilter"] = { ref: `A1:${lastColumnLetter}1` };

  const workbook = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Work Orders");

  const outputFilename = filename || "action-dates.xlsx";

  XLSXStyle.writeFile(workbook, outputFilename);
}
