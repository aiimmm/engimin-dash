import { describe, expect, it } from "vitest";
import {
  extractAdminCompletedNote,
  generateRejectedScheduleTextReport,
  getTaskRejectInfo,
  isEngineerScheduleRejected,
} from "../components/EngineerRejectedScheduleReport";
import {
  calculateWoCtoPrice,
  compareRiClusters,
  extractRiNumber,
  normalizeCompletedWoItem,
} from "./index";

function cleanToken(str) {
  return String(str || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function createMatcher(internalEngineers = [], vendorEngineers = []) {
  const internalTokenMap = new Map();
  const vendorTokens = new Set();

  internalEngineers.forEach((eng) => {
    [eng.username, eng.fullname, eng.name].forEach((val) => {
      const token = cleanToken(val);
      if (token && token.length >= 2) internalTokenMap.set(token, eng);
    });
  });

  vendorEngineers.forEach((eng) => {
    [eng.username, eng.fullname, eng.name].forEach((val) => {
      const token = cleanToken(val);
      if (token && token.length >= 2) vendorTokens.add(token);
    });
  });

  return function findInternalEngineer(
    engName,
    engUsername = "",
    engType = "",
    completedUser = "",
    currentEngineerName = "",
  ) {
    const upper = String(engName || "")
      .trim()
      .toUpperCase();
    const type = String(engType || "")
      .trim()
      .toLowerCase();
    const cUser = String(completedUser || "")
      .trim()
      .toUpperCase();
    const uName = String(engUsername || "")
      .trim()
      .toUpperCase();
    const currName = String(currentEngineerName || "")
      .trim()
      .toUpperCase();

    if (!upper || upper === "UNASSIGNED" || upper === "—" || upper === "-" || upper === "NULL") {
      return null;
    }

    if (
      type === "vendor_engineer" ||
      type.includes("vendor") ||
      upper.includes("VENDOR") ||
      upper.startsWith("VND ") ||
      upper.startsWith("V-") ||
      cUser.includes("VENDOR") ||
      uName.includes("VENDOR") ||
      currName.includes("VENDOR")
    ) {
      return null;
    }

    const candidateTokens = [
      cleanToken(upper),
      cleanToken(uName),
      cleanToken(currName),
      cleanToken(cUser),
    ].filter((t) => t && t.length >= 2);

    for (const tToken of candidateTokens) {
      if (vendorTokens.has(tToken)) return null;
    }

    if (internalTokenMap.size > 0) {
      for (const tToken of candidateTokens) {
        if (internalTokenMap.has(tToken)) {
          return internalTokenMap.get(tToken);
        }
        for (const [iToken, eng] of internalTokenMap.entries()) {
          if (
            (tToken.length >= 4 && iToken.startsWith(tToken)) ||
            (iToken.length >= 4 && tToken.startsWith(iToken)) ||
            (tToken.length >= 4 && iToken.includes(tToken))
          ) {
            return eng;
          }
        }
      }
    }

    if (internalEngineers.length === 0) {
      return {
        id: cleanToken(upper),
        name: engName,
        fullname: engName,
        username: engUsername || engName,
        user_type: "engineer",
      };
    }

    return null;
  };
}

describe("Engineer Monitoring Stats Calculation", () => {
  const internalEngineers = [
    {
      id: 1,
      fullname: "Heri Purwanto",
      username: "heri.purwa",
      name: "Heri Purwanto",
      user_type: "engineer",
    },
    {
      id: 2,
      fullname: "Bramantyo Bassura",
      username: "bram.bassura",
      name: "Bramantyo",
      user_type: "engineer",
    },
  ];
  const vendorEngineers = [
    {
      id: 99,
      fullname: "Vendor Lemondial",
      username: "lemondial",
      name: "Lemondial AC",
      user_type: "vendor_engineer",
    },
  ];

  it("accurately matches internal engineers by username or fullname", () => {
    const match = createMatcher(internalEngineers, vendorEngineers);

    // Matching username with dot
    expect(match("HERI.PURWA")).toMatchObject({ id: 1, fullname: "Heri Purwanto" });
    // Matching fullname
    expect(match("Heri Purwanto")).toMatchObject({ id: 1 });
    // Matching lowercase username
    expect(match("bram.bassura")).toMatchObject({ id: 2 });
  });

  it("strictly excludes vendor engineers and vendor names", () => {
    const match = createMatcher(internalEngineers, vendorEngineers);

    expect(match("lemondial")).toBeNull();
    expect(match("Vendor Lemondial")).toBeNull();
    expect(match("Vendor AC Surabaya")).toBeNull();
    expect(match("Random Guy", "", "vendor_engineer")).toBeNull();
  });

  it("calculates Cara C: average CTO and task completed per internal engineer", () => {
    // Example from user:
    // Engineer 1: 3 WO, CTO 243.000
    // Engineer 2: 4 WO, CTO 104.000
    const internalEngList = [
      { id: 1, completedWo: 3, totalCto: 243000 },
      { id: 2, completedWo: 4, totalCto: 104000 },
    ];

    const totalInternalCount = internalEngList.length;
    const sumWo = internalEngList.reduce((acc, e) => acc + e.completedWo, 0);
    const sumCto = internalEngList.reduce((acc, e) => acc + e.totalCto, 0);

    const avgTask = sumWo / totalInternalCount;
    const avgCto = sumCto / totalInternalCount;

    expect(avgTask).toBe(3.5); // (3 + 4) / 2 = 3.5 WO per engineer
    expect(avgCto).toBe(173500); // (243.000 + 104.000) / 2 = 173.500 per engineer
  });

  describe("calculateWoCtoPrice with various transaction types", () => {
    it("extracts total fee from Payment Link including 11% PPN", () => {
      const item = {
        ctoPrice: null,
        ctoList: [],
        paymentList: [{ jasa: "50000", material: "0", subTotalPrice: 50000, price: 55500 }],
        totalPaymentFeeAmount: 55500,
      };
      expect(calculateWoCtoPrice(item)).toBe(55500);
    });

    it("extracts chargeTo from paymentLinkTo (Customer vs Owner)", () => {
      const customerItem = {
        id: 1,
        engineeringPropertyFee: {
          miscPayment: { paymentLinkTo: "customer" },
        },
      };
      expect(normalizeCompletedWoItem(customerItem).chargeTo).toBe("customer");

      const ownerItem = {
        id: 2,
        engineeringPropertyFee: {
          miscPayment: { paymentLinkTo: "owner" },
        },
      };
      expect(normalizeCompletedWoItem(ownerItem).chargeTo).toBe("owner");
    });

    it("returns 0 for pure Post Charge Material Dalam (guest penalty only)", () => {
      const item = {
        ctoPrice: null,
        ctoList: [],
        tempExpense: [],
        postChargeList: [{ price: 200000, item_name: "Alat kebersihan" }],
      };
      expect(calculateWoCtoPrice(item)).toBe(0);
    });

    it("extracts cto_price from tempExpense for Post Charge Material Luar", () => {
      const item = {
        ctoPrice: null,
        ctoList: [],
        postChargeList: [{ price: 400000, item_name: "Kunci hilang 2 Pcs" }],
        tempExpense: [{ cto_price: 55000, price: 55000, cto_category_name: "Kunci Hilang 2" }],
      };
      expect(calculateWoCtoPrice(item)).toBe(55000);
    });

    it("extracts cto_price from PO / Temporary Expense", () => {
      const item = {
        ctoPrice: null,
        ctoList: [],
        tempExpense: [
          { cto_price: 850000, price: 850000, cto_category_name: "Dipan Bed", poNo: "PO2609.1285" },
        ],
      };
      expect(calculateWoCtoPrice(item)).toBe(850000);
    });

    it("extracts completedUser and completedDate directly from item without taking from tracingSchedule", () => {
      const item = {
        id: 1476220,
        wo_no: "WO-CSTPM-26110419125959968053",
        created_user: "Emilia Nurdiyanti",
        created_date: "2026-11-04 19:12:59",
        updated_user: "Fahrul Rifqi",
        updated_date: "2026-11-05 17:53:19",
        completed_user: "Fahrul Rifqi",
        completed_date: "2026-11-05 17:53:19",
        tracingSchedule: [
          {
            completed_user: "Wrong Tracing User",
            status: "Completed",
          },
        ],
      };

      const normalized = normalizeCompletedWoItem(item);
      expect(normalized.completedUser).toBe("Fahrul Rifqi");
      expect(normalized.completedDate).toBe("2026-11-05 17:53:19");
      expect(normalized.updatedDate).toBe("2026-11-05 17:53:19");
    });
  });

  describe("Engineer Schedule Rejected Report", () => {
    it("correctly identifies rejected work orders by engineer_status", () => {
      const taskRejected = {
        id: "WO-1",
        wo_no: "WO-1",
        fullname: "Miftakhul Huda",
        engineer_status: "Rejected",
        status: "On Progress",
      };
      const taskAssign = {
        id: "WO-2",
        wo_no: "WO-2",
        fullname: "Akmal Fadilah",
        engineer_status: "Assign",
        status: "New",
      };
      expect(isEngineerScheduleRejected(taskRejected)).toBe(true);
      expect(isEngineerScheduleRejected(taskAssign)).toBe(false);
    });

    it("does not falsely identify reassigned tasks whose engineer_status is active as rejected", () => {
      const taskReassigned = {
        id: "WO-3",
        wo_no: "WO-3",
        fullname: "Arip Mujiono",
        engineer_status: "Assign",
        tracingSchedule: [{ status: "Rejected", reservationtraces_status: "Rejected" }],
      };
      // Must follow engineer_status so it syncs exactly 1:1 with stats cards
      expect(isEngineerScheduleRejected(taskReassigned)).toBe(false);
    });

    it("explicitly excludes 'Rejected WO Guarantee' tasks", () => {
      const taskGuarantee = {
        id: "WO-4",
        wo_no: "WO-4",
        fullname: "Dedi Supardi",
        engineer_status: "Rejected WO Guarantee",
        status: "Rejected WO Guarantee",
      };
      const taskGuaranteeDate = {
        id: "WO-5",
        wo_no: "WO-5",
        fullname: "Eko Prasetyo",
        engineer_status: "Rejected",
        rejected_wo_guarantee_date: "2026-11-06 14:00:00",
      };
      expect(isEngineerScheduleRejected(taskGuarantee)).toBe(false);
      expect(isEngineerScheduleRejected(taskGuaranteeDate)).toBe(false);
    });

    it("detects historical schedule rejection in detail even if status was rescheduled to New", () => {
      const taskRescheduled = {
        id: 1409859,
        wo_no: "WO-CSTPM-26090316024141957787",
        reservationtraces_status: "New",
        wo_status: "On Progress",
        detail: [
          {
            id: 4790993,
            update_time: "2026-11-10 20:11:43",
            remark: "tetap perlu ada link paymennya tim",
            created_user: "Latif Imam Prabowo",
          },
          {
            id: 4790994,
            update_time: "2026-11-10 20:11:53",
            remark: "Schedule WO from Wildan L rejected by Latif Imam Prabowo",
            created_user: "Latif Imam Prabowo",
            status: "COMPLETE",
            isComplete: 1,
          },
        ],
      };

      const rejectInfo = getTaskRejectInfo(taskRescheduled);
      expect(rejectInfo.isRejected).toBe(true);
      expect(rejectInfo.admin).toBe("Latif Imam Prabowo");
      expect(rejectInfo.note).toBe("tetap perlu ada link paymennya tim");
      expect(rejectInfo.date).toContain("2026-11-10");
    });

    it("generates WhatsApp formatted text report properly", () => {
      const sampleTasks = [
        {
          id: "WO-ROTPM-2026111116072032495",
          wo_no: "WO-ROTPM-2026111116072032495",
          fullname: "Budi Santoso",
          cluster: "RI 1 - Jakarta PT",
          towerName: "Tokyo Riverside PIK 2 Apartment - Dotonburi",
          roomName: "Tower Dotonbori-Floor 16-Unit 3",
          roomCode: "6AE662A32",
          wo_status: "On Progress",
          reason: "sesuai SOP baru foto harus lengkap",
        },
      ];

      const report = generateRejectedScheduleTextReport(sampleTasks, {
        date: "2026-11-12",
      });

      expect(report).toContain("*REPORT WO REJECT (12/11/2026)*");
      expect(report).toContain("📊 Total Rejected: 1 WO | 1 Engineer | 1 Cluster");
      expect(report).toContain("-------------------------------------------------");
      expect(report).toContain("📍 *RI 1 - JAKARTA PT (1 WO)*");
      expect(report).toContain(
        '1. Tokyo Riverside PIK 2 Apartment - Dotonburi - Tower Dotonbori-Floor 16-Unit 3 | WO-ROTPM-2026111116072032495 | (GenID: 6AE662A32) >>> "sesuai SOP baru foto harus lengkap"',
      );
      expect(report).toContain(
        "Mohon tim Supervisor / Leader untuk segera reassign atau tindak lanjuti WO di atas. 🙏",
      );
    });
  });

  describe("Cluster RI Number Sorting", () => {
    it("extracts RI number correctly", () => {
      expect(extractRiNumber("RI 1 - Jakarta Selatan")).toBe(1);
      expect(extractRiNumber("RI 2 - JAKARTA BU")).toBe(2);
      expect(extractRiNumber("RI 10 - Karawaci")).toBe(10);
      expect(extractRiNumber("Non-RI Cluster")).toBe(null);
    });

    it("sorts clusters from RI 1 up to the largest RI number", () => {
      const clusters = [
        "RI 10 - Karawaci",
        "RI 6 - Tangerang",
        "RI 2 - JAKARTA BU",
        "RI 1 - Jakarta Selatan",
        "RI 5 - Surabaya",
        "RI 5 - Bandung",
      ];

      const sorted = [...clusters].sort(compareRiClusters);

      expect(sorted).toEqual([
        "RI 1 - Jakarta Selatan",
        "RI 2 - JAKARTA BU",
        "RI 5 - Bandung",
        "RI 5 - Surabaya",
        "RI 6 - Tangerang",
        "RI 10 - Karawaci",
      ]);
    });
  });

  describe("extractAdminCompletedNote", () => {
    it("extracts the exact human admin note from WO detail logs, skipping engineer and system remarks", () => {
      const task = {
        id: "WO-1478007",
        wo_no: "WO-1478007",
        fullname: "Andriyansyah",
        detail: [
          {
            id: 4776340,
            workorders_id: 1478007,
            is_nightaudit: 0,
            update_time: "2026-11-06 13:32:56",
            remark: "Create WO from LioHK with close out status open",
            housekeeping_notes: null,
            remark_image: null,
            created_date: "2026-11-06 13:32:56",
            created_user: "roland",
            updated_date: "2026-11-06 13:32:56",
            updated_user: null,
            status: "PENDING",
            is_show: 1,
            isComplete: 0,
          },
          {
            id: 4777902,
            workorders_id: 1478007,
            is_nightaudit: 0,
            update_time: "2026-11-06 18:53:23",
            remark:
              "done, perbaikan dinding di atas balkon yang berlubang menggunakan material dalam 120cm x 70cm ,durasi pengerjakan 30 menit ",
            housekeeping_notes:
              "done, perbaikan dinding di atas balkon yang berlubang menggunakan material dalam 120cm x 70cm ,durasi pengerjakan 30 menit ",
            remark_image: null,
            created_date: "2026-11-06 18:53:23",
            created_user: "andriyansyah.eng",
            updated_date: "2026-11-06 18:53:23",
            updated_user: null,
            status: "PENDING",
            is_show: 1,
            isComplete: 0,
          },
          {
            id: 4777954,
            workorders_id: 1478007,
            is_nightaudit: 0,
            update_time: "2026-11-06 19:05:17",
            remark: "itu ada kayu tidak sekalian dirapikan team?",
            housekeeping_notes: "itu ada kayu tidak sekalian dirapikan team?",
            remark_image: null,
            created_date: "2026-11-06 19:05:17",
            created_user: "Novalo Harnando",
            updated_date: "2026-11-06 19:05:17",
            updated_user: null,
            status: "PENDING",
            is_show: 1,
            isComplete: 0,
          },
          {
            id: 4777957,
            workorders_id: 1478007,
            is_nightaudit: 0,
            update_time: "2026-11-06 19:05:23",
            remark: "Schedule WO from Andriyansyah  rejected by Novalo Harnando",
            housekeeping_notes: null,
            remark_image: null,
            created_date: "2026-11-06 19:05:23",
            created_user: "Novalo Harnando",
            updated_date: "2026-11-06 19:05:23",
            updated_user: "Novalo Harnando",
            status: "COMPLETE",
            isComplete: 1,
          },
          {
            id: 4778066,
            workorders_id: 1478007,
            is_nightaudit: 0,
            update_time: "2026-11-06 19:23:43",
            remark: "itu bukan kayu,itu buangan AC  [Remark for WO Rejected]",
            housekeeping_notes: "itu bukan kayu,itu buangan AC  [Remark for WO Rejected]",
            remark_image: null,
            created_date: "2026-11-06 19:23:43",
            created_user: "andriyansyah.eng",
            updated_date: "2026-11-06 19:23:43",
            updated_user: null,
            status: "PENDING",
            is_show: 1,
            isComplete: 0,
          },
        ],
      };

      const result = extractAdminCompletedNote(task);

      expect(result).toEqual({
        id: 4777954,
        note: "itu ada kayu tidak sekalian dirapikan team?",
        admin: "Novalo Harnando",
        date: "2026-11-06 19:05:17",
      });
    });

    it("extracts reason note from previous admin Novalo Harnando when latest reject is automated extend by Agung Yoga Setiawan", () => {
      const task = {
        id: "WO-ROTPM-2026061022572523409",
        wo_no: "WO-ROTPM-2026061022572523409",
        fullname: "abdulmaki.eng",
        detail: [
          {
            id: 4342777,
            workorders_id: 1267644,
            update_time: "2026-06-16 11:10:20",
            remark: "Extend WO from 2026-06-15 to 2026-06-16 by Agung Yoga Setiawan",
            housekeeping_notes: "Note : Kulit kursi meja makan mengelupas P 70 cm L 40 cm",
            created_user: "Agung Yoga Setiawan",
            status: "COMPLETE",
            isComplete: 1,
          },
          {
            id: 4353484,
            workorders_id: 1267644,
            update_time: "2026-06-20 13:50:04",
            remark: "Extend WO from 2026-06-16 to 2026-06-26 by Agung Yoga Setiawan",
            housekeeping_notes: "Note : Kulit kursi meja makan mengelupas P 70 cm L 40 cm",
            created_user: "Agung Yoga Setiawan",
            status: "COMPLETE",
            isComplete: 1,
          },
          {
            id: 4760945,
            workorders_id: 1267644,
            update_time: "2026-11-01 18:24:32",
            remark:
              "done. pengecatan dinding belakang pintu kamar kedua. dinding terlihat belang dikarenakan cat belum kering sepenuhnya. material dalam 20 menit.2x2 m",
            created_user: "ari.sigit",
            status: "PENDING",
            isComplete: 0,
          },
          {
            id: 4761582,
            workorders_id: 1267644,
            update_time: "2026-11-01 21:52:01",
            remark: "remark WO tidak sesuai (Kulit kursi meja makan mengelupas) dengan notes",
            housekeeping_notes:
              "remark WO tidak sesuai (Kulit kursi meja makan mengelupas) dengan notes",
            created_user: "Novalo Harnando",
            status: "PENDING",
            isComplete: 0,
          },
          {
            id: 4761583,
            workorders_id: 1267644,
            update_time: "2026-11-01 21:52:13",
            remark: "Schedule WO from Ari Sigit rejected by Novalo Harnando",
            created_user: "Novalo Harnando",
            status: "COMPLETE",
            isComplete: 1,
          },
          {
            id: 4762137,
            workorders_id: 1267644,
            update_time: "2026-11-02 11:38:44",
            remark: "Extend WO from 2026-11-02 to 2026-11-30 by Agung Yoga Setiawan",
            housekeeping_notes: "-",
            created_user: "Agung Yoga Setiawan",
            status: "COMPLETE",
            isComplete: 1,
          },
          {
            id: 4762139,
            workorders_id: 1267644,
            update_time: "2026-11-02 11:39:02",
            remark: "Schedule WO from Ari Sigit rejected by Agung Yoga Setiawan",
            created_user: "Agung Yoga Setiawan",
            status: "COMPLETE",
            isComplete: 1,
          },
        ],
      };

      const result = extractAdminCompletedNote(task);

      expect(result).toEqual({
        id: 4761582,
        note: "remark WO tidak sesuai (Kulit kursi meja makan mengelupas) dengan notes",
        admin: "Novalo Harnando",
        date: "2026-11-01 21:52:01",
      });
    });

    it("prefers the most recent non-engineer manual note even if schedule was later rejected by another admin without comment", () => {
      const task = {
        action_date: "2026-11-09 00:00:00",
        detail: [
          {
            id: 3527684,
            update_time: "2025-11-01 17:49:50",
            remark: "Schedule WO from Putra Chandra rejected by Teguh Santoso",
            created_user: "Teguh Santoso",
          },
          {
            id: 3527690,
            update_time: "2025-11-01 17:51:00",
            remark: "kerjakan ulang ",
            created_user: "Teguh Santoso",
          },
          {
            id: 4778100,
            update_time: "2026-11-07 20:10:00",
            remark: "done. perbaikan dinding balkon",
            created_user: "khairil.umam",
          },
          {
            id: 4778200,
            update_time: "2026-11-07 21:32:27",
            remark: "foto after berbeda titik team",
            housekeeping_notes: "foto after berbeda titik team",
            created_user: "Ahmad Riky Dzulfikar",
          },
          {
            id: 4779000,
            update_time: "2026-11-09 09:45:38",
            remark: "Schedule WO from Khairil Umam rejected by Teguh Santoso",
            created_user: "Teguh Santoso",
          },
        ],
      };

      const result = extractAdminCompletedNote(task);

      expect(result).toEqual({
        id: 4778200,
        note: "foto after berbeda titik team",
        admin: "Ahmad Riky Dzulfikar",
        date: "2026-11-07 21:32:27",
      });
    });
  });
});
