import { describe, expect, it } from "vitest";
import { calculateWoCtoPrice, normalizeCompletedWoItem } from "./index";

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
  });
});
