import { afterEach, describe, expect, it, vi } from "vitest";
import {
  REQUIRED_WO_SHEET_HEADERS,
  formatActionDateForSheet,
  formatCheckInDateForSheet,
  formatRequiredWoDataForSheet,
  formatWorkOrderRowForSheet,
  getConflictDateRangeForSync,
  getIndonesianDayName,
  getIndonesianSheetName,
  syncRequiredWorkorderToGoogleSheet,
} from "./index";

describe("required-wo-sheet service", () => {
  it("getConflictDateRangeForSync calculates 1-week ahead range inclusive (7 days)", () => {
    const range = getConflictDateRangeForSync("2026-09-23");
    expect(range.from).toBe("2026-09-23");
    expect(range.to).toBe("2026-09-29");
  });

  it("getIndonesianDayName returns correct Indonesian day name", () => {
    expect(getIndonesianDayName("2026-09-08")).toBe("Selasa");
    expect(getIndonesianDayName("2026-09-09")).toBe("Rabu");
    expect(getIndonesianDayName("2026-09-10")).toBe("Kamis");
    expect(getIndonesianDayName("2026-09-11")).toBe("Jumat");
    expect(getIndonesianDayName("2026-09-12")).toBe("Sabtu");
    expect(getIndonesianDayName("2026-09-13")).toBe("Minggu");
    expect(getIndonesianDayName("2026-09-14")).toBe("Senin");
  });

  it("getIndonesianSheetName returns correct formatted sheet name e.g. Rabu, 09-09-2026", () => {
    expect(getIndonesianSheetName("2026-09-09")).toBe("Rabu, 09-09-2026");
    expect(getIndonesianSheetName("2026-08-09")).toBe("Minggu, 09-08-2026");
  });

  it("formatCheckInDateForSheet formats date as DD-MM-YYYY", () => {
    expect(formatCheckInDateForSheet("2026-09-23")).toBe("23-09-2026");
    expect(formatCheckInDateForSheet("2026-09-23 14:00:00")).toBe("23-09-2026");
    expect(formatCheckInDateForSheet("23/09/2026")).toBe("23-09-2026");
    expect(formatCheckInDateForSheet("")).toBe("-");
  });

  it("formatActionDateForSheet formats date as DD-MM-YYYY — HH:mm without seconds", () => {
    expect(formatActionDateForSheet("2026-09-23 10:30:00")).toBe("23-09-2026 — 10:30");
    expect(formatActionDateForSheet("23/09/2026 10:30:00")).toBe("23-09-2026 — 10:30");
    expect(formatActionDateForSheet("2026-09-09 09:30:00")).toBe("09-09-2026 — 09:30");
  });

  it("formatRequiredWoDataForSheet creates structured 12-column payload with Appointment and CI Conflict rows", () => {
    const mockAppointmentRows = [
      {
        woNumber: "WO-001",
        actionDate: "2026-09-23 10:30:00",
        engineer: "A.WIDODO",
        towerName: "Tokyo Riverside",
        roomName: "Tower Dotonbori-Floor 16-Unit 3",
        roomCode: "B5D13111D1A",
        roomStatus: "Minor",
        woStatus: "On Progress",
        department: "engineering",
        remark: "Appointment note",
        cluster: "Pik 2",
        latestReservation: {
          genId: "279CE48A4D1",
          formattedCheckinDate: "2026-09-23",
          checkinDate: "2026-09-23",
        },
      },
    ];

    const mockConflictRows = [
      {
        woNumber: "WO-002",
        actionDate: "2026-09-23 14:00:00",
        engineer: "B.SANTOSO",
        towerName: "Bassura City",
        roomName: "Tower Alamanda-Floor 8-Unit 12",
        roomCode: "BC8A12",
        department: "engineering",
        remark: "Conflict note",
        cluster: "Bassura",
        ciDate: "2026-09-23",
        activeReservation: { genId: "BC-BOOK-999", formattedCheckinDate: "2026-09-23" },
      },
    ];

    const mockAgingRows = [
      {
        woNumber: "WO-003",
        actionDate: "2026-09-21 09:00:00",
        engineer: "C.DARMAWAN",
        towerName: "Green Pramuka",
        roomName: "Tower Chrysant-Floor 10-Unit 1",
        roomCode: "GP10C1",
        department: "engineering",
        remark: "Aging note",
        cluster: "Pramuka",
      },
    ];

    const result = formatRequiredWoDataForSheet([], {
      date: "2026-09-23",
      appointmentRows: mockAppointmentRows,
      conflictRows: mockConflictRows,
      agingRows: mockAgingRows,
    });

    expect(result.spreadsheetName).toBe(process.env.REQUIRED_WO_SHEET_NAME || "Required WO");
    expect(result.sheetName).toBe("Rabu, 23-09-2026");
    expect(result.headers).toEqual(REQUIRED_WO_SHEET_HEADERS);
    expect(result.headers.length).toBe(14);
    expect(result.totalRows).toBe(3);
    expect(result.appointmentCount).toBe(1);
    expect(result.conflictCount).toBe(1);
    expect(result.agingCount).toBe(1);

    // Row 1: Appointment
    expect(result.rows[0][0]).toBe(1); // No.
    expect(result.rows[0][1]).toBe(true); // Assign/Unassign (Checkbox)
    expect(result.rows[0][2]).toBe("Appointment"); // Category
    expect(result.rows[0][3]).toBe("WO-001"); // WO
    expect(result.rows[0][4]).toBe("Appointment note"); // Note
    expect(result.rows[0][5]).toBe("279CE48A4D1"); // BookingID
    expect(result.rows[0][6]).toBe("23-09-2026"); // Check-In Date
    expect(result.rows[0][8]).toBe("23-09-2026 — 10:30"); // Action Date
    expect(result.rows[0][9]).toBe("B5D13111D1A"); // GenID
    expect(result.rows[0][10]).toBe("Tokyo Riverside — Tower Dotonbori-Floor 16-Unit 3"); // Unit
    expect(result.rows[0][11]).toBe("A.Widodo"); // Engineer
    expect(result.rows[0][12]).toBe("Engineering"); // DIC
    expect(result.rows[0][13]).toBe("Pik 2"); // Cluster

    // Row 2: CI Conflict below Appointment
    expect(result.rows[1][0]).toBe(2); // No.
    expect(result.rows[1][1]).toBe(true); // Assign/Unassign (Checkbox)
    expect(result.rows[1][2]).toBe("CI Conflict"); // Category
    expect(result.rows[1][3]).toBe("WO-002"); // WO
    expect(result.rows[1][4]).toBe("Conflict note"); // Note
    expect(result.rows[1][5]).toBe("BC-BOOK-999"); // BookingID
    expect(result.rows[1][6]).toBe("23-09-2026"); // Check-In Date
    expect(result.rows[1][8]).toBe("23-09-2026 — 14:00"); // Action Date
    expect(result.rows[1][9]).toBe("BC8A12"); // GenID
    expect(result.rows[1][10]).toBe("Bassura City — Tower Alamanda-Floor 8-Unit 12"); // Unit
    expect(result.rows[1][11]).toBe("B.Santoso"); // Engineer
    expect(result.rows[1][12]).toBe("Engineering"); // DIC
    expect(result.rows[1][13]).toBe("Bassura"); // Cluster

    // Row 3: Aging below CI Conflict
    expect(result.rows[2][0]).toBe(3); // No.
    expect(result.rows[2][1]).toBe(true); // Assign/Unassign (Checkbox)
    expect(result.rows[2][2]).toBe("Aging"); // Category
    expect(result.rows[2][3]).toBe("WO-003"); // WO
    expect(result.rows[2][4]).toBe("Aging note"); // Note
    expect(result.rows[2][11]).toBe("C.Darmawan"); // Engineer
    expect(result.rows[2][13]).toBe("Pramuka"); // Cluster
  });

  it("formatWorkOrderRowForSheet sets Assign/Unassign to false when engineer is unassigned or empty", () => {
    const unassignedRow = {
      woNumber: "WO-999",
      engineer: "Unassigned",
    };
    const formatted = formatWorkOrderRowForSheet(unassignedRow, "Appointment", 1);
    expect(formatted[1]).toBe(false);
    expect(formatted[2]).toBe("Appointment");
    expect(formatted[11]).toBe("Unassigned");

    const emptyEngRow = {
      woNumber: "WO-999",
      engineer: "",
    };
    const formattedEmpty = formatWorkOrderRowForSheet(emptyEngRow, "Appointment", 2);
    expect(formattedEmpty[1]).toBe(false);
    expect(formattedEmpty[2]).toBe("Appointment");
    expect(formattedEmpty[11]).toBe("Unassigned");
  });

  it("formatRequiredWoDataForSheet excludes non-applicable articles from spreadsheet payload", () => {
    const mockRows = [
      {
        woNumber: "WO-NORMAL",
        article: "AC Bocor",
      },
      {
        woNumber: "WO-EXCLUDED-1",
        article: "Access Card hilang 1",
      },
      {
        woNumber: "WO-EXCLUDED-2",
        article: "Gas Habis",
      },
    ];

    const result = formatRequiredWoDataForSheet(mockRows, {
      date: "2026-09-25",
      appointmentRows: mockRows,
      conflictRows: mockRows,
      agingRows: mockRows,
    });

    // Appointment keeps all rows, conflict and aging filter out excluded articles
    expect(result.appointmentCount).toBe(3);
    expect(result.conflictCount).toBe(1);
    expect(result.agingCount).toBe(1);
    expect(result.totalRows).toBe(5);
  });

  describe("syncRequiredWorkorderToGoogleSheet", () => {
    const originalEnv = process.env.REQUIRED_WO_SHEET_WEBHOOK_URL;
    const originalOldEnv = process.env.APPOINTMENT_SHEET_WEBHOOK_URL;
    const originalSheetName = process.env.REQUIRED_WO_SHEET_NAME;

    afterEach(() => {
      process.env.REQUIRED_WO_SHEET_WEBHOOK_URL = originalEnv;
      process.env.APPOINTMENT_SHEET_WEBHOOK_URL = originalOldEnv;
      process.env.REQUIRED_WO_SHEET_NAME = originalSheetName;
      vi.restoreAllMocks();
    });

    it("returns configured: false when webhook URL is missing", async () => {
      delete process.env.REQUIRED_WO_SHEET_WEBHOOK_URL;
      delete process.env.APPOINTMENT_SHEET_WEBHOOK_URL;

      const res = await syncRequiredWorkorderToGoogleSheet({ rows: [], date: "2026-09-23" });
      expect(res.configured).toBe(false);
      expect(res.data.spreadsheetName).toBe(process.env.REQUIRED_WO_SHEET_NAME || "Required WO");
      expect(res.data.sheetName).toBe("Rabu, 23-09-2026");
    });

    it("calls webhook fetch when REQUIRED_WO_SHEET_WEBHOOK_URL is set", async () => {
      process.env.REQUIRED_WO_SHEET_WEBHOOK_URL = "https://script.google.com/test-appointment";
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: "success" }),
      });

      const res = await syncRequiredWorkorderToGoogleSheet({
        appointmentRows: [{ woNumber: "WO-1" }],
        conflictRows: [{ woNumber: "WO-2" }],
        date: "2026-09-23",
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://script.google.com/test-appointment",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(res.success).toBe(true);
      expect(res.data.totalRows).toBe(2);
    });
  });
});
