import { describe, expect, it } from "vitest";
import {
  calculateConflictStats,
  calculateDicStats,
  checkIsBreakContract,
  checkIsInHouse,
  createActionDatesPayload,
  createConflictPayload,
  createCreatedTodayPayload,
  createWorkOrderPayload,
  defaultConflictRange,
  EXTRA_DEPARTMENT_QUERIES,
  EXCLUDED_CONFLICT_ARTICLES,
  generateAppointmentReport,
  generateConflictReport,
  generateCreatedTodayReport,
  generateWorkOrderReport,
  getBreakContractNotice,
  getDepartmentCategory,
  getRoomStatusCategory,
  hasScheduledActionTime,
  isAddOnsWorkOrder,
  isCleaningAcAdditionalItem,
  isExcludedConflictArticle,
  jakartaTodayNumber,
  mergeWorkOrderRows,
  normalizeActiveReservation,
  normalizeLatestReservation,
  normalizeUser,
  normalizeWorkOrder,
  normalizeWorkOrderResponse,
  today,
  yesterday,
} from "./index";

describe("work order adapters", () => {
  it("creates the required engineering payload", () => {
    const payload = createWorkOrderPayload({
      dateFrom: "2026-08-25",
      dateTo: "2026-08-25",
      offset: 20,
      limit: 10,
    });
    expect(payload).toMatchObject({
      status: ["1", "2"],
      departmentInCharge: "engineering",
      isInHouse: "yes",
      actionDate_from: "2026-08-25",
      actionDate_to: "2026-08-25",
      offset: 20,
    });
  });

  it("normalizes variant upstream field names", () => {
    expect(
      normalizeWorkOrder({
        wo_id: 42,
        wo_number: "WO-42",
        tower_name: "A",
        status: "2",
      }),
    ).toMatchObject({ id: "42", woNumber: "WO-42", towerName: "A", status: "Active" });
  });

  it("maps the requested WO fields and selects the latest reservation", () => {
    expect(
      normalizeWorkOrder({
        _id: "wo-1",
        wo_no: "WO-001",
        note: "Periksa AC",
        roomcode: "A-01",
        fo_rooms_id: 28283,
        towername: "Tower A",
        roomname: "101",
        roomstatuses_name: "Occupied",
        currentEngineerName: "Budi",
        department_in_charge: "engineering",
        wo_status: "2",
        ota_book_number: "7DC84C8858B",
        ci_date: "2026-09-02 14:00:00",
        co_date: "2026-09-02 12:00:00",
      }),
    ).toMatchObject({
      id: "wo-1",
      woNumber: "WO-001",
      remark: "Periksa AC",
      roomCode: "A-01",
      foRoomsId: 28283,
      towerName: "Tower A",
      roomName: "101",
      roomStatus: "Occupied",
      engineer: "Budi",
      department: "engineering",
      status: "Active",
      otaBookNumber: "7DC84C8858B",
      ciDate: "2026-09-02 14:00:00",
      coDate: "2026-09-02 12:00:00",
    });
    expect(
      normalizeLatestReservation({
        data: [
          { genId: "OLD", formattedCheckinDate: 20260101 },
          { genId: "NEW", formattedCheckinDate: 20260824, guestName: "Vici" },
        ],
      }),
    ).toMatchObject({ genId: "NEW", checkinDate: 20260824, guestName: "Vici" });
  });

  it("only treats guests with checkout after today as still staying", () => {
    const response = {
      data: [
        { genId: "CHECKED-OUT", formattedCheckinDate: 20260801, formattedCheckoutDate: 20260825 },
        { genId: "ACTIVE", formattedCheckinDate: 20260825, formattedCheckoutDate: 20260925 },
        { genId: "FUTURE", formattedCheckinDate: 20260925, formattedCheckoutDate: 20261025 },
      ],
    };
    expect(normalizeActiveReservation(response, 20260825)).toMatchObject({ genId: "ACTIVE" });
    expect(normalizeActiveReservation({ data: [response.data[0]] }, 20260825)).toBeNull();
  });

  it("creates a Jakarta date key independent from the server timezone", () => {
    expect(jakartaTodayNumber(new Date("2026-08-24T17:30:00.000Z"))).toBe(20260825);
  });

  it("filters explicitly unscheduled midnight action times", () => {
    expect(hasScheduledActionTime("2026-08-26 00:00:00")).toBe(false);
    expect(hasScheduledActionTime("2026-08-26T00:00:00.000Z")).toBe(false);
    expect(hasScheduledActionTime("2026-08-26 08:30:00")).toBe(true);
    expect(hasScheduledActionTime("2026-08-26")).toBe(true);
    expect(hasScheduledActionTime(null)).toBe(false);
  });

  it("extracts rows and total from common response envelopes", () => {
    expect(normalizeWorkOrderResponse({ data: { rows: [{ id: 1 }], total: 12 } })).toMatchObject({
      total: 12,
      rows: [{ id: "1" }],
    });
  });

  it("keeps only safe account fields in the normalized user", () => {
    expect(
      normalizeUser({
        data: [
          {
            _id: "user-7",
            name: "Ari",
            usr: "ari",
            pwd: "must-not-leak",
            email: "ari@example.com",
            isActive: true,
            dept: { departmentName: "Operational" },
          },
          {},
          {},
          [{ groupName: "[Operational]" }, { groupName: "[Reports]" }],
        ],
      }),
    ).toEqual({
      id: "user-7",
      name: "Ari",
      username: "ari",
      email: "ari@example.com",
      department: "Operational",
      role: "[Operational], [Reports]",
      status: "Active",
    });
  });

  it("sends the requested department_in_charge instead of always engineering", () => {
    expect(createWorkOrderPayload({ department: "-" })).toMatchObject({
      departmentInCharge: "-",
    });
    expect(createWorkOrderPayload({})).toMatchObject({ departmentInCharge: "engineering" });
  });

  it("recognizes Add Ons items from root fields or tracingSchedule", () => {
    expect(
      isAddOnsWorkOrder(normalizeWorkOrder({ type: "Additional Item", gc_type: "Cleaning AC" })),
    ).toBe(true);
    expect(
      isAddOnsWorkOrder(normalizeWorkOrder({ note: "Add Ons: Cuci AC-", type: "Complaint" })),
    ).toBe(true);
    expect(
      isAddOnsWorkOrder(
        normalizeWorkOrder({
          created_user: "System",
          tracingSchedule: [
            {
              note: "Add Ons: Cuci AC-",
              type: "Additional Item",
              gc_type: "cleaning ac",
              create_source: "Travelio App",
            },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      isAddOnsWorkOrder(
        normalizeWorkOrder({ type: "Preventive Maintenance", note: "Routine Check" }),
      ),
    ).toBe(false);
  });

  it("merges dic '-' / 'Unassigned' rows only when they are Add Ons items, and deduplicates by id", () => {
    const engineeringRows = [
      normalizeWorkOrder({
        _id: "eng-1",
        department_in_charge: "engineering",
        type: "Preventive Maintenance",
      }),
    ];
    const extraRowSets = [
      [
        normalizeWorkOrder({
          _id: "dash-1",
          department_in_charge: "-",
          type: "Additional Item",
          gc_type: "cleaning ac",
        }),
        normalizeWorkOrder({
          _id: "dash-2",
          department_in_charge: "-",
          type: "Preventive Maintenance",
          note: "General inspection",
        }),
      ],
      [
        normalizeWorkOrder({
          _id: "unassigned-1",
          department_in_charge: "Unassigned",
          type: "Complaint",
          note: "Add Ons: Cuci Sofa",
        }),
        normalizeWorkOrder({
          _id: "eng-1",
          department_in_charge: "engineering",
        }),
      ],
    ];

    const merged = mergeWorkOrderRows(engineeringRows, extraRowSets);
    expect(merged.map((row) => row.id)).toEqual(["eng-1", "dash-1", "dash-2", "unassigned-1"]);
  });

  it("includes EXTRA_DEPARTMENT_QUERIES with traveliomart and operational", () => {
    expect(EXTRA_DEPARTMENT_QUERIES).toContain("traveliomart");
    expect(EXTRA_DEPARTMENT_QUERIES).toContain("operational");
    expect(EXTRA_DEPARTMENT_QUERIES).toContain("-");
    expect(EXTRA_DEPARTMENT_QUERIES).toContain("Unassigned");
  });

  it("merges traveliomart and operational rows only when is_guestAppointment is yes", () => {
    const engineeringRows = [
      normalizeWorkOrder({
        _id: "eng-1",
        department_in_charge: "engineering",
        type: "Repair",
      }),
    ];
    const extraRowSets = [
      [
        normalizeWorkOrder({
          _id: "tm-1",
          department_in_charge: "traveliomart",
          is_guestAppointment: "yes",
          type: "Additional Item",
        }),
        normalizeWorkOrder({
          _id: "tm-2",
          department_in_charge: "traveliomart",
          is_guestAppointment: "no",
          type: "Additional Item",
        }),
      ],
      [
        normalizeWorkOrder({
          _id: "ops-1",
          department_in_charge: "operational",
          is_guestAppointment: "yes",
          type: "Inspection",
        }),
        normalizeWorkOrder({
          _id: "ops-2",
          department_in_charge: "operational",
          is_guestAppointment: "no",
          type: "Inspection",
        }),
      ],
    ];

    const merged = mergeWorkOrderRows(engineeringRows, extraRowSets);
    expect(merged.map((row) => row.id)).toEqual(["eng-1", "tm-1", "ops-1"]);
  });

  it("creates created-today payload with from_date and to_date", () => {
    const payload = createCreatedTodayPayload({
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      posDate: "2026-08-31",
    });
    expect(payload).toMatchObject({
      status: ["1", "2"],
      departmentInCharge: "",
      from_date: "2026-09-01",
      to_date: "2026-09-01",
      pos_date: "2026-08-31",
      limit: "",
      offset: 0,
    });
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("creates the required action dates payload", () => {
    const payload = createActionDatesPayload({
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      posDate: "2026-09-02",
    });

    expect(payload).toEqual({
      status: ["1", "2"],
      cluster_id: [],
      engginerId: "",
      departmentInCharge: "engineering",
      actionDate_from: "2026-09-01",
      actionDate_to: "2026-09-01",
      skipCountPaging: 0,
      poStatus: "",
      pos_date: "2026-09-02",
      limit: "",
      offset: 0,
    });
  });

  it("returns yesterday date in yyyy-MM-dd format", () => {
    expect(yesterday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("normalizes department in charge categories accurately", () => {
    expect(getDepartmentCategory("Engineering")).toBe("Engineering");
    expect(getDepartmentCategory("ORM")).toBe("ORM");
    expect(getDepartmentCategory("Traveliomart")).toBe("Traveliomart");
    expect(getDepartmentCategory("Customer Service")).toBe("CS");
    expect(getDepartmentCategory("CS")).toBe("CS");
    expect(getDepartmentCategory("Operational")).toBe("Operational");
    expect(getDepartmentCategory("Technical Auditor")).toBe("Technical Auditor");
    expect(getDepartmentCategory("Admin Inventory")).toBe("Admin Inventory");
    expect(getDepartmentCategory("-")).toBe("Unassigned / null");
    expect(getDepartmentCategory("Unassigned")).toBe("Unassigned / null");
    expect(getDepartmentCategory("")).toBe("Unassigned / null");
    expect(getDepartmentCategory(null)).toBe("Unassigned / null");
  });

  it("normalizes room status categories accurately", () => {
    expect(getRoomStatusCategory("Major")).toBe("Major");
    expect(getRoomStatusCategory("Minor")).toBe("Minor");
    expect(getRoomStatusCategory("-")).toBe("No Status");
    expect(getRoomStatusCategory("—")).toBe("No Status");
    expect(getRoomStatusCategory("")).toBe("No Status");
    expect(getRoomStatusCategory(null)).toBe("No Status");
  });

  it("computes DIC and Room Status stats breakdown across all rows", () => {
    const rows = [
      { department: "Engineering", roomStatus: "Major" },
      { department: "engineering", roomStatus: "Minor" },
      { department: "ORM", roomStatus: "-" },
      { department: "Traveliomart", roomStatus: "—" },
      { department: "CS", roomStatus: "Major" },
      { department: "Operational", roomStatus: "Minor" },
      { department: "Technical Auditor", roomStatus: "" },
      { department: "Admin Inventory", roomStatus: "Major" },
      { department: "-", roomStatus: "Minor" },
      { department: "Unassigned", roomStatus: null },
    ];
    const stats = calculateDicStats(rows);
    expect(stats).toEqual({
      Total: 10,
      Engineering: 2,
      ORM: 1,
      Traveliomart: 1,
      CS: 1,
      Operational: 1,
      TechnicalAuditor: 1,
      AdminInventory: 1,
      Unassigned: 2,
      Major: 3,
      Minor: 3,
      NoRoomStatus: 4,
    });
  });

  it("generates formatted report omitting 0 count departments and room status with compact date", () => {
    const rows = [
      { department: "Engineering", roomStatus: "Major" },
      { department: "engineering", roomStatus: "Minor" },
      { department: "ORM", roomStatus: "-" },
    ];

    const allClusterReport = generateWorkOrderReport(rows, {
      selectedClusters: [],
      date: "2026-09-01",
    });

    expect(allClusterReport).toContain("REPORT ALL CLUSTER");
    expect(allClusterReport).toContain("WO Created Today (01/09/2026)");
    expect(allClusterReport).toContain("- Total : 3");
    expect(allClusterReport).toContain("- Engineering : 2");
    expect(allClusterReport).toContain("- ORM : 1");
    expect(allClusterReport).not.toContain("CS :");
    expect(allClusterReport).not.toContain("Traveliomart :");
    expect(allClusterReport).toContain("- Major : 1");
    expect(allClusterReport).toContain("- Minor : 1");

    const singleClusterReport = generateWorkOrderReport(rows, {
      selectedClusters: ["Tangerang"],
      date: "2026-09-01",
    });
    expect(singleClusterReport).toContain("REPORT CLUSTER TANGERANG");
  });

  it("generates appointment report sorted chronologically with multi-cluster title and compact date", () => {
    const rows = [
      {
        actionDate: "2026-09-01 10:30:00",
        engineer: "budi",
        towerName: "Tower A",
        roomName: "101",
      },
      {
        actionDate: "2026-09-01 09:30:00",
        engineer: "andi",
        towerName: "Tower A",
        roomName: "202",
      },
      {
        actionDate: "2026-09-01 09:30:00",
        engineer: "candra",
        towerName: "Tower B",
        roomName: "303",
      },
    ];

    const allReport = generateAppointmentReport(rows, { selectedClusters: [], date: "2026-09-01" });
    expect(allReport).toContain("REPORT APPOINTMENT ALL CLUSTER (01/09/2026)");

    const multiReport = generateAppointmentReport(rows, {
      selectedClusters: ["RI 2 - Jakarta BU", "RI 6 - Tangerang"],
      date: "2026-09-02",
    });

    expect(multiReport).toContain(
      "REPORT APPOINTMENT RI 2 - JAKARTA BU, RI 6 - TANGERANG (02/09/2026)",
    );
    expect(multiReport).toMatch(
      /JAM 09\.30[\s\S]*1\. Handle by ANDI \/\/ Tower A - 202 \/\/ [\s\S]*2\. Handle by CANDRA \/\/ Tower B - 303 \/\/ [\s\S]*JAM 10\.30[\s\S]*1\. Handle by BUDI \/\/ Tower A - 101 \/\//,
    );
  });

  it("deduplicates repeated engineer and unit entries within the same time block", () => {
    const duplicateRows = [
      {
        actionDate: "2026-09-01 10:00:00",
        engineer: "HERI.PURWA",
        towerName: "Tower Akihabara",
        roomName: "Unit 56",
      },
      {
        actionDate: "2026-09-01 10:00:00",
        engineer: "HERI.PURWA",
        towerName: "Tower Akihabara",
        roomName: "Unit 56",
      },
      {
        actionDate: "2026-09-01 10:00:00",
        engineer: "HERI.PURWA",
        towerName: "Tower Akihabara",
        roomName: "Unit 56",
      },
      {
        actionDate: "2026-09-01 10:00:00",
        engineer: "LEMONDIALAC",
        towerName: "Tower Blue Diamond",
        roomName: "Unit H",
      },
    ];

    const report = generateAppointmentReport(duplicateRows, {
      selectedClusters: ["RI 2 - JAKARTA BU"],
      date: "2026-09-03",
    });

    expect(report).toContain("1. Handle by HERI.PURWA // Tower Akihabara - Unit 56 // ");
    expect(report).toContain("2. Handle by LEMONDIALAC // Tower Blue Diamond - Unit H //");
    expect(report).not.toContain("3. Handle by");
  });

  it("generates created today report with non-zero counters and clean formatting", () => {
    const rows = [
      { department: "engineering", roomStatus: "Major" },
      { department: "engineering", roomStatus: "Minor" },
      { department: "traveliomart", roomStatus: "Minor" },
    ];

    const report = generateCreatedTodayReport(rows, {
      selectedClusters: ["Grand Kamala Lagoon"],
      date: "2026-09-19",
    });

    const expected = [
      "REPORT CLUSTER GRAND KAMALA LAGOON",
      "WO Created Today (19/09/2026)",
      "- Total : 3",
      "Department In Charge",
      "- Engineering : 2",
      "- Traveliomart : 1",
      "Room Status",
      "- Major : 1",
      "- Minor : 2",
    ].join("\n");

    expect(report).toBe(expected);
  });

  describe("checkIsInHouse rules", () => {
    it("returns false if neither current nor future reservation exists (Rule 6)", () => {
      expect(checkIsInHouse({})).toBe(false);
    });

    it("returns true if current reservation exists and future reservation is missing (Rule 2)", () => {
      expect(checkIsInHouse({ activeReservation: { genId: "RES-1" } })).toBe(true);
    });

    it("returns true if current and future exist with 0 or 1 day date gap (Rule 1)", () => {
      expect(
        checkIsInHouse({
          activeReservation: { genId: "CURR", checkoutDate: "2026-09-02" },
          otaBookNumber: "FUT",
          ciDate: "2026-09-03",
        }),
      ).toBe(true);
    });

    it("returns false if future exists and check-in date is in the future (Rule 5)", () => {
      expect(
        checkIsInHouse({
          otaBookNumber: "FUT",
          ciDate: "2099-01-01 14:00:00",
        }),
      ).toBe(false);
    });
  });

  describe("conflict dates adapters and stats", () => {
    it("defaultConflictRange generates date range 1 to 7 days ahead", () => {
      const base = new Date("2026-09-14T00:00:00");
      const range = defaultConflictRange(base);
      expect(range).toEqual({ from: "2026-09-15", to: "2026-09-21" });
    });

    it("creates required conflict payload with defaults", () => {
      const payload = createConflictPayload({
        cluster: "Cluster A",
        dateFrom: "2026-09-15",
        dateTo: "2026-09-21",
        posDate: "2026-09-14",
      });
      expect(payload).toEqual({
        status: ["1", "2"],
        cluster_id: ["Cluster A"],
        engginerId: "",
        departmentInCharge: "",
        isInHouse: "no",
        isPreComplete: "incomplete",
        nextCI_from_date: "2026-09-15",
        nextCI_to_date: "2026-09-21",
        sortBy: "newest",
        skipCountPaging: 0,
        poStatus: "",
        pos_date: "2026-09-14",
        limit: "",
        offset: 0,
      });
    });

    it("correctly identifies excluded conflict articles", () => {
      expect(EXCLUDED_CONFLICT_ARTICLES).toHaveLength(7);
      expect(isExcludedConflictArticle("Access Card hilang 1")).toBe(true);
      expect(isExcludedConflictArticle("break contract")).toBe(true);
      expect(isExcludedConflictArticle("Gas Habis")).toBe(true);
      expect(isExcludedConflictArticle("Matras Protector Cuci")).toBe(true);
      expect(isExcludedConflictArticle("Pre Live")).toBe(true);
      expect(isExcludedConflictArticle("Refresh Unit - CO Long Term")).toBe(true);
      expect(isExcludedConflictArticle("Tunggakan IPL/LIstrik/Air")).toBe(true);
      expect(isExcludedConflictArticle("AC Bocor")).toBe(false);
      expect(isExcludedConflictArticle("")).toBe(false);
    });

    it("calculateConflictStats calculates all required conflict stats", () => {
      const rows = [
        { roomCode: "GEN-01", status: "New", department: "engineering", roomStatus: "Major" },
        { roomCode: "GEN-01", status: "Active", department: "operational", roomStatus: "Minor" },
        { roomCode: "GEN-02", status: "2", department: "traveliomart", roomStatus: "" },
        { roomCode: "GEN-03", status: "New", department: "admin inventory", roomStatus: "Minor" },
        { roomCode: "GEN-04", status: "New", department: "ORM", roomStatus: "Major" },
        { roomCode: "GEN-05", status: "New", department: "CS", roomStatus: "" },
        { roomCode: "GEN-06", status: "New", department: "technical auditor", roomStatus: "" },
        { roomCode: "GEN-07", status: "New", department: "Unassigned", roomStatus: "" },
      ];

      const stats = calculateConflictStats(rows);
      expect(stats).toEqual({
        Total: 8,
        TotalUnit: 7,
        Assigned: 0,
        UnassignedEngineer: 8,
        New: 6,
        OnProgress: 2,
        Engineering: 1,
        Operational: 1,
        Traveliomart: 1,
        AdminInventory: 1,
        ORM: 1,
        CS: 1,
        TechnicalAuditor: 1,
        Unassigned: 1,
        Major: 2,
        Minor: 2,
        NoRoomStatus: 4,
      });
    });

    it("generateConflictReport creates formatted report for conflict dates", () => {
      const rows = [
        {
          roomCode: "GEN-A",
          engineer: "Budi",
          status: "New",
          department: "engineering",
          roomStatus: "Major",
        },
        {
          roomCode: "GEN-B",
          engineer: "Unassigned",
          status: "Active",
          department: "operational",
          roomStatus: "Minor",
        },
      ];
      const report = generateConflictReport(rows, {
        selectedClusters: ["Cluster B"],
        dateRange: { from: "2026-09-15", to: "2026-09-21" },
      });

      expect(report).toContain("REPORT CLUSTER CLUSTER B");
      expect(report).toContain("WO CONFLICT DATES (15/09/2026 - 21/09/2026)");
      expect(report).toContain("-> Total Conflict Dates : 2");
      expect(report).toContain("-> Total Assigned All : 1");
      expect(report).toContain("-> Total Unassigned All : 1");
      expect(report).toContain("DIC Engineering");
      expect(report).toContain("DIC Operational (OPS)");
      expect(report).toContain("DIC Traveliomart");
      expect(report).toContain("DIC Admin Inventory");
      expect(report).toContain("DIC Customer Service (CS)");
      expect(report).toContain("DIC Owner Relationship Management (ORM)");
      expect(report).toContain("DIC Unassigned (-)");
    });
  });

  describe("checkIsBreakContract rules", () => {
    const baseToday = new Date("2026-09-25T10:00:00Z");

    it("returns false if breakcontract_date is in the future (e.g. 2027-04-01)", () => {
      expect(checkIsBreakContract("2027-04-01 00:00:00", baseToday)).toBe(false);
      expect(checkIsBreakContract("2026-10-01", baseToday)).toBe(false);
    });

    it("returns true if breakcontract_date has already passed (e.g. 2026-09-19)", () => {
      expect(checkIsBreakContract("2026-09-19 00:00:00", baseToday)).toBe(true);
      expect(checkIsBreakContract("2026-09-24", baseToday)).toBe(true);
      expect(checkIsBreakContract("2026-09-25 00:00:00", baseToday)).toBe(true);
    });

    it("returns false if breakcontract_date is null, empty, or undefined", () => {
      expect(checkIsBreakContract(null, baseToday)).toBe(false);
      expect(checkIsBreakContract("", baseToday)).toBe(false);
      expect(checkIsBreakContract("—", baseToday)).toBe(false);
      expect(checkIsBreakContract(undefined, baseToday)).toBe(false);
    });

    it("normalizeWorkOrder assigns isBreakContract correctly based on date comparison", () => {
      const futureWO = normalizeWorkOrder({
        breakcontract_date: "2027-04-01 00:00:00",
      });
      expect(futureWO.breakContractDate).toBe("2027-04-01 00:00:00");
      expect(futureWO.isBreakContract).toBe(false);

      const pastWO = normalizeWorkOrder({
        breakcontract_date: "2026-09-19 00:00:00",
      });
      expect(pastWO.breakContractDate).toBe("2026-09-19 00:00:00");
      expect(pastWO.isBreakContract).toBe(true);
    });
  });

  describe("getBreakContractNotice rules", () => {
    const today = new Date("2026-10-31T12:00:00");

    it("returns upcoming notice if break contract date is tomorrow (diffDays === 1)", () => {
      const notice = getBreakContractNotice({ breakContractDate: "2026-11-01 00:00:00" }, today);
      expect(notice).toEqual({
        type: "upcoming",
        label: "Akan break contract pada:",
        date: "01-11-2026",
      });
    });

    it("returns broken notice if break contract date is today (diffDays === 0)", () => {
      const notice = getBreakContractNotice({ breakContractDate: "2026-10-31 00:00:00" }, today);
      expect(notice).toEqual({
        type: "broken",
        label: "Break Contract:",
        date: "31-10-2026",
      });
    });

    it("returns broken notice if break contract date has passed (diffDays < 0)", () => {
      const notice = getBreakContractNotice({ breakContractDate: "2026-10-30 00:00:00" }, today);
      expect(notice).toEqual({
        type: "broken",
        label: "Break Contract:",
        date: "30-10-2026",
      });
    });

    it("returns null if break contract date is more than 1 day in the future", () => {
      const notice = getBreakContractNotice({ breakContractDate: "2026-11-05 00:00:00" }, today);
      expect(notice).toBeNull();
    });

    it("returns null if breakcontract_date equals endcontract_date (normal checkout)", () => {
      const notice = getBreakContractNotice(
        {
          breakContractDate: "2026-11-01 00:00:00",
          endContractDate: "2026-11-01 00:00:00",
        },
        today,
      );
      expect(notice).toBeNull();
    });

    it("returns broken notice with date 'Yes' if isBreakContract is true without valid date", () => {
      const notice = getBreakContractNotice(
        { isBreakContract: true, breakContractDate: null },
        today,
      );
      expect(notice).toEqual({
        type: "broken",
        label: "Break Contract:",
        date: "Yes",
      });
    });

    it("returns null when no break date and not broken", () => {
      expect(getBreakContractNotice({}, today)).toBeNull();
      expect(getBreakContractNotice({ breakContractDate: "—" }, today)).toBeNull();
    });
  });
});
