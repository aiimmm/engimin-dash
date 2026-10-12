import { describe, expect, it } from "vitest";
import {
  calculateAgingStats,
  createAgingPayload,
  defaultAgingDateRange,
  generateAgingReport,
  isExcludedAgingArticle,
} from "./index";

describe("Aging Work Orders Library", () => {
  it("defaultAgingDateRange generates from 4 days ago to yesterday", () => {
    const baseDate = new Date("2026-09-25T10:00:00Z");
    const range = defaultAgingDateRange(baseDate);
    expect(range.from).toBe("2026-09-21");
    // to should be yesterday relative to today
    expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("createAgingPayload formats required parameters with defaults", () => {
    const payload = createAgingPayload({
      cluster: "Tangerang",
      engineer: "John",
      dateFrom: "2026-09-21",
      dateTo: "2026-09-24",
      posDate: "2026-09-25",
    });

    expect(payload.status).toEqual(["1", "2"]);
    expect(payload.cluster_id).toEqual(["Tangerang"]);
    expect(payload.engginerId).toBe("John");
    expect(payload.isInHouse).toBe("no");
    expect(payload.isPreComplete).toBe("incomplete");
    expect(payload.from_date).toBe("2026-09-21");
    expect(payload.to_date).toBe("2026-09-24");
    expect(payload.pos_date).toBe("2026-09-25");
    expect(payload.skipCountPaging).toBe(0);
    expect(payload.offset).toBe(0);
  });

  it("calculateAgingStats calculates all required counters accurately", () => {
    const rows = [
      {
        roomCode: "UNIT-101",
        engineer: "budi",
        woStatus: "New",
        department: "Engineering",
        roomStatus: "Major",
      },
      {
        roomCode: "UNIT-102",
        engineer: "Unassigned",
        woStatus: "On Progress",
        department: "ORM",
        roomStatus: "Minor",
      },
      {
        roomCode: "UNIT-101", // duplicate unit
        engineer: "andi",
        woStatus: "2",
        department: "CS",
        roomStatus: "-",
      },
    ];

    const stats = calculateAgingStats(rows);
    expect(stats.Total).toBe(3);
    expect(stats.TotalUnit).toBe(2);
    expect(stats.Assigned).toBe(2);
    expect(stats.UnassignedEngineer).toBe(1);
    expect(stats.New).toBe(1);
    expect(stats.OnProgress).toBe(2);
    expect(stats.Engineering).toBe(1);
    expect(stats.ORM).toBe(1);
    expect(stats.CS).toBe(1);
    expect(stats.Major).toBe(1);
    expect(stats.Minor).toBe(1);
    expect(stats.NoRoomStatus).toBe(1);
  });

  it("generateAgingReport creates formatted report for aging work orders", () => {
    const rows = [
      {
        cluster: "RI 6 - Tangerang",
        department: "Engineering",
        roomStatus: "Major",
      },
      {
        cluster: "RI 6 - Tangerang",
        department: "ORM",
        roomStatus: "Minor",
      },
    ];

    const report = generateAgingReport(rows, {
      selectedClusters: ["RI 6 - Tangerang"],
      dateRange: { from: "2026-09-21", to: "2026-09-24" },
    });

    expect(report).toContain("REPORT AGING CLUSTER RI 6 - TANGERANG");
    expect(report).toContain("WO Aging (21/09/2026 s/d 24/09/2026)");
    expect(report).toContain("- Total : 2");
    expect(report).toContain("Department In Charge");
    expect(report).toContain("- Engineering : 1");
    expect(report).toContain("- ORM : 1");
    expect(report).toContain("Room Status");
    expect(report).toContain("- Major : 1");
    expect(report).toContain("- Minor : 1");
  });

  it("correctly identifies excluded aging articles", () => {
    expect(isExcludedAgingArticle("Access Card hilang 1")).toBe(true);
    expect(isExcludedAgingArticle("Break contract")).toBe(true);
    expect(isExcludedAgingArticle("Gas Habis")).toBe(true);
    expect(isExcludedAgingArticle("Matras Protector Cuci")).toBe(true);
    expect(isExcludedAgingArticle("Pre Live")).toBe(true);
    expect(isExcludedAgingArticle("Refresh Unit - CO Long Term")).toBe(true);
    expect(isExcludedAgingArticle("Tunggakan IPL/LIstrik/Air")).toBe(true);
    expect(isExcludedAgingArticle("AC Rusak")).toBe(false);
  });
});
