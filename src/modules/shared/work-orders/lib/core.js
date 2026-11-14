// ============================================================================
// LIB / API — Shared Work Orders Domain Logic (Dashboard)
// Purpose: Core work order normalization, reservation resolution, in-house checks, & filters
// ============================================================================

import { addDays, format } from "date-fns";

const first = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "") ?? "—";

export function tomorrow() {
  return format(addDays(new Date(), 1), "yyyy-MM-dd");
}

export function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function yesterday() {
  return format(addDays(new Date(), -1), "yyyy-MM-dd");
}

export function defaultConflictRange(baseDate = new Date()) {
  return {
    from: format(addDays(baseDate, 1), "yyyy-MM-dd"),
    to: format(addDays(baseDate, 7), "yyyy-MM-dd"),
  };
}

export const EXCLUDED_CONFLICT_ARTICLES = [
  "Access Card hilang 1",
  "Break contract",
  "Gas Habis",
  "Matras Protector Cuci",
  "Pre Live",
  "Refresh Unit - CO Long Term",
  "Tunggakan IPL/LIstrik/Air",
];

export function isExcludedConflictArticle(articleName) {
  if (!articleName || articleName === "—" || articleName === "-") return false;
  const normalized = String(articleName).toLowerCase().trim();
  return EXCLUDED_CONFLICT_ARTICLES.some(
    (excluded) => excluded.toLowerCase().trim() === normalized,
  );
}

export function isExcludedAppointmentDepartment(departmentName) {
  if (!departmentName || departmentName === "—" || departmentName === "-") return false;
  const dept = String(departmentName).toLowerCase().trim();
  return (
    dept === "admin inventory" ||
    dept.includes("inventory") ||
    dept === "technical auditor" ||
    dept.includes("auditor") ||
    dept === "orm" ||
    dept.includes("orm") ||
    dept === "cs" ||
    dept.includes("cs")
  );
}

export function createConflictPayload(filters = {}) {
  const tDate = today();
  const tomorrowDate = tomorrow();
  const next7DaysDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

  return {
    status: Array.isArray(filters.status) && filters.status.length ? filters.status : ["1", "2"],
    cluster_id: Array.isArray(filters.cluster)
      ? filters.cluster
      : filters.cluster
        ? [filters.cluster]
        : [],
    engginerId: filters.engineer || filters.engginerId || "",
    departmentInCharge: filters.department || filters.departmentInCharge || "",
    isInHouse: filters.isInHouse || "no",
    isPreComplete: filters.isPreComplete || "incomplete",
    nextCI_from_date:
      filters.nextCI_from_date || filters.nextCIFromDate || filters.dateFrom || tomorrowDate,
    nextCI_to_date:
      filters.nextCI_to_date || filters.nextCIToDate || filters.dateTo || next7DaysDate,
    sortBy: filters.sortBy || "newest",
    skipCountPaging: 0,
    poStatus: filters.poStatus || "",
    pos_date: filters.posDate || filters.pos_date || tDate,
    limit: filters.limit !== undefined && filters.limit !== null ? String(filters.limit) : "",
    offset: Number(filters.offset || 0),
  };
}

export function createActionDatesPayload(filters = {}) {
  const yDate = yesterday();
  const tDate = today();
  return {
    status: filters.status?.length ? filters.status : ["1", "2"],
    cluster_id: filters.cluster ? [filters.cluster] : [],
    engginerId: filters.engineer || "",
    departmentInCharge: filters.department || "engineering",
    actionDate_from: filters.dateFrom || filters.actionDate_from || yDate,
    actionDate_to: filters.dateTo || filters.actionDate_to || yDate,
    skipCountPaging: 0,
    poStatus: "",
    pos_date: filters.posDate || filters.pos_date || tDate,
    limit: filters.limit ?? "",
    offset: Number(filters.offset || 0),
  };
}

export function createCreatedTodayPayload(filters = {}) {
  const date = today();
  return {
    status: filters.status?.length ? filters.status : ["1", "2"],
    cluster_id: filters.cluster ? [filters.cluster] : [],
    engginerId: filters.engineer || "",
    departmentInCharge: filters.department || "",
    from_date: filters.dateFrom || filters.fromDate || date,
    to_date: filters.dateTo || filters.toDate || date,
    skipCountPaging: 0,
    poStatus: "",
    pos_date: filters.posDate || filters.pos_date || "",
    limit: String(filters.limit ?? ""),
    offset: Number(filters.offset || 0),
    sortBy: filters.sortBy || "",
    sortDirection: filters.sortDirection || "",
  };
}

export function createWorkOrderPayload(filters = {}) {
  const date = tomorrow();
  return {
    status: filters.status?.length ? filters.status : ["1", "2"],
    cluster_id: filters.cluster ? [filters.cluster] : [],
    engginerId: filters.engineer || "",
    departmentInCharge: filters.department || "engineering",
    isInHouse: "yes",
    isPreComplete: "incomplete",
    woGuestAppointmentStatus: filters.woGuestAppointmentStatus || "yes",
    actionDate_from: filters.dateFrom || date,
    actionDate_to: filters.dateTo || date,
    skipCountPaging: 0,
    poStatus: "",
    pos_date: filters.posDate || filters.pos_date || "",
    limit: String(filters.limit ?? 10),
    offset: Number(filters.offset || 0),
    sortBy: filters.sortBy || "",
    sortDirection: filters.sortDirection || "",
  };
}

export function normalizeUser(loginResponse) {
  const source = Array.isArray(loginResponse?.data)
    ? loginResponse.data[0]
    : loginResponse?.data?.user || loginResponse?.data || {};
  const groups = Array.isArray(loginResponse?.data?.[3]) ? loginResponse.data[3] : [];
  const groupNames = groups
    .map((group) => group?.groupName)
    .filter(Boolean)
    .join(", ");
  return {
    id: first(source._id, source.id, source.user_id, source.userId, source.uid),
    name: first(source.name, source.full_name, source.fullName, source.username),
    username: first(source.usr, source.username, source.user_name),
    email: first(source.email, source.email_address),
    department: first(
      source.dept?.departmentName,
      source.department,
      source.department_name,
      source.departmentInCharge,
    ),
    role: first(
      groupNames,
      source.group_permission,
      source.groupPermission,
      source.role,
      "Engineering",
    ),
    status: first(
      source.status,
      source.isActive === false || source.is_active === false ? "Inactive" : "Active",
    ),
  };
}

export function extractAccessToken(loginResponse) {
  const source = Array.isArray(loginResponse?.data)
    ? loginResponse.data[0]
    : loginResponse?.data || {};
  return first(
    loginResponse?.encryptedUserData,
    loginResponse?.token,
    loginResponse?.access_token,
    source.token,
    source.access_token,
    "",
  );
}

function normalizeStatus(value) {
  const status = String(value ?? "New").toLowerCase();
  if (["3", "completed", "complete", "closed", "done"].includes(status)) return "Completed";
  if (["2", "active", "progress", "in progress"].includes(status)) return "Active";
  if (["4", "pending", "hold", "on hold"].includes(status)) return "Pending";
  return "New";
}

export function normalizeLatestReservation(response) {
  const reservations = Array.isArray(response?.data) ? response.data : [];
  if (reservations.length === 0) return null;
  // Ambil elemen paling akhir (terbaru) dari array response data API
  const latest = reservations[reservations.length - 1];
  return normalizeReservation(latest);
}

function normalizeReservation(reservation) {
  if (!reservation) return null;
  return {
    _id: reservation._id || "",
    guestName: first(reservation.guestName),
    contactName: first(reservation.contactName, reservation.guestName),
    contactPhone: first(reservation.contactPhone),
    formattedCheckinDate: reservation.formattedCheckinDate || null,
    formattedCheckoutDate: reservation.formattedCheckoutDate || null,
    stayDurationType: reservation.stayDurationType || "",
    genId: first(reservation.genId),
    tpmReservationId: reservation.tpmReservationId || "",
    checkinDate: first(reservation.formattedCheckinDate),
    checkoutDate: first(reservation.formattedCheckoutDate),
  };
}

export function jakartaTodayNumber(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type) => parts.find((part) => part.type === type)?.value || "";
  return Number(`${read("year")}${read("month")}${read("day")}`);
}

export function hasScheduledActionTime(value) {
  if (value === undefined || value === null || value === "" || value === "—") return false;
  const actionDate = String(value).trim();
  const midnightPattern = /(?:T|\s)00:00:00(?:\.0+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
  return !midnightPattern.test(actionDate);
}

export function normalizeActiveReservation(response, today = jakartaTodayNumber()) {
  const reservations = Array.isArray(response?.data) ? response.data : [];
  const active = reservations
    .filter((reservation) => {
      const checkin = Number(reservation.formattedCheckinDate || 0);
      const checkout = Number(reservation.formattedCheckoutDate || 0);
      return checkin <= today && checkout > today;
    })
    .sort(
      (left, right) =>
        Number(right.formattedCheckinDate || 0) - Number(left.formattedCheckinDate || 0),
    )[0];
  return normalizeReservation(active);
}

// ─── Pending Churn Detection ──────────────────────────────────────────────────

/** Teks remark yang di-generate sistem saat WO dibuat dari proses Pending Churn */
const PENDING_CHURN_REMARK_FRAGMENT =
  "Mohon dibantu untuk pengecekan WO outstanding unit berikut karena unit akan di serah terima kan";

/**
 * Evaluasi status WO Pending Churn / Break Contract pada history room.
 *
 * Indikator WO Pending Churn:
 *   - create_source mengandung "Pending Churn" (case-insensitive)
 *   - remark mengandung fragment teks "Dear Team Eng" / "Mohon dibantu untuk pengecekan WO outstanding unit berikut karena unit akan di serah terima kan"
 *   - workorder_articles_id === 736 (atau article "break contract" / "pending churn")
 *
 * Mengembalikan:
 *   - hasActivePendingChurn: boolean (ada WO pending churn dengan status New / Pending / Active)
 *   - hasCancelledPendingChurn: boolean (ada WO pending churn dengan status Cancelled atau cancelled_user)
 *   - latestPendingChurn: object | null
 *
 * @param {object[]} historyItems - array item dari getListWOHistoryPerRoomV2
 * @returns {{ hasActivePendingChurn: boolean, hasCancelledPendingChurn: boolean, latestPendingChurn: object|null }}
 */
export function evaluatePendingChurnHistory(historyItems = []) {
  if (!Array.isArray(historyItems) || !historyItems.length) {
    return {
      hasActivePendingChurn: false,
      hasCancelledPendingChurn: false,
      latestPendingChurn: null,
    };
  }

  const churnItems = historyItems.filter((item) => {
    const remark = String(item.remark || "").toLowerCase();
    const source = String(item.create_source || "").toLowerCase();
    const article = String(item.wo_articles || item.article || "").toLowerCase();
    const articleId = Number(item.workorder_articles_id || item.articles_id || 0);

    const isRemarkMatch =
      remark.includes(
        "mohon dibantu untuk pengecekan wo outstanding unit berikut karena unit akan di serah terima kan",
      ) ||
      (remark.includes("dear team eng") && remark.includes("serah terima"));
    const isSourceMatch = source.includes("pending churn");
    const isArticleMatch =
      articleId === 736 || article.includes("break contract") || article.includes("pending churn");

    return isRemarkMatch || isSourceMatch || isArticleMatch;
  });

  if (churnItems.length === 0) {
    return {
      hasActivePendingChurn: false,
      hasCancelledPendingChurn: false,
      latestPendingChurn: null,
    };
  }

  // Sort latest first (by id descending or created_date)
  const sorted = [...churnItems].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  const latest = sorted[0];

  const hasActivePendingChurn = churnItems.some((item) => {
    const status = String(item.status || item.rt_status || "")
      .trim()
      .toLowerCase();
    const isCancelled =
      status === "cancelled" || Boolean(item.cancelled_user) || Boolean(item.cancelled_date);
    const isComplete = status === "completed" || item.is_completed === 1;
    return (
      !isCancelled &&
      !isComplete &&
      (status === "new" || status === "pending" || status === "active" || status === "on progress")
    );
  });

  const hasCancelledPendingChurn = churnItems.some((item) => {
    const status = String(item.status || item.rt_status || "")
      .trim()
      .toLowerCase();
    return status === "cancelled" || Boolean(item.cancelled_user) || Boolean(item.cancelled_date);
  });

  return {
    hasActivePendingChurn,
    hasCancelledPendingChurn: hasCancelledPendingChurn && !hasActivePendingChurn,
    latestPendingChurn: latest,
  };
}

/**
 * Cek apakah array WO history mengandung WO "Pending Churn" yang masih aktif (status New/Pending).
 * Jika ada, berarti unit sedang dalam proses break contract meskipun tanggalnya belum lewat.
 *
 * @param {object[]} historyItems - array item dari getListWOHistoryPerRoomV2
 * @returns {boolean}
 */
export function checkHasPendingChurnWo(historyItems) {
  const result = evaluatePendingChurnHistory(historyItems);
  return result.hasActivePendingChurn;
}

// ─── Break Contract Check ─────────────────────────────────────────────────────

/**
 * Menentukan apakah sebuah WO sedang dalam status Break Contract.
 *
 * Kondisi TRUE (salah satu terpenuhi):
 *
 * A. Tanggal-based:
 *   1. breakcontract_date tidak null/kosong
 *   2. breakcontract_date <= hari ini
 *   3. breakcontract_date !== endcontract_date (jika sama = CO normal bukan break)
 *
 * B. Pending Churn history (override tanggal):
 *   1. breakcontract_date tidak null
 *   2. Room memiliki WO history Pending Churn dengan status New/Pending
 *      → meskipun breakcontract_date masih di masa depan
 *
 * Pengecualian FALSE (Break contract dibatalkan):
 *   - Jika WO Pending Churn ("Dear Team Eng...") sudah di-cancel
 *   - DAN unit property_status === "Active" & hotel_status === "active"
 *   - DAN tidak ada WO pending churn yang aktif
 *
 * @param {string|null} breakDateValue         - nilai breakcontract_date dari API
 * @param {string|null} endDateValue           - nilai endcontract_date dari API
 * @param {Date}        baseDate               - referensi "hari ini" (default: new Date())
 * @param {boolean}     hasPendingChurnHistory - apakah room punya WO Pending Churn aktif
 * @param {object}      context                - { propertyStatus, hotelStatus, isPendingChurnCancelled }
 */
/** Parse berbagai format date ke Date object (midnight) */
export function parseToMidnight(raw) {
  if (!raw || raw === "—" || raw === "-" || raw === true) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{8}$/.test(s)) {
    return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const dmy = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function fmtDate(value) {
  if (!value || value === true || value === "—" || value === "-") return "—";
  const str = String(value).trim();
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(6, 8)}-${str.slice(4, 6)}-${str.slice(0, 4)}`;
  }
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return str;
}

export function checkIsBreakContract(
  breakDateValue,
  endDateValue = null,
  baseDate = new Date(),
  hasPendingChurnHistory = false,
  context = {},
) {
  // Support overloaded signature: checkIsBreakContract(breakDateValue, baseDate)
  if (endDateValue instanceof Date) {
    baseDate = endDateValue;
    endDateValue = null;
  }
  // Support if 4th parameter is an object: checkIsBreakContract(breakDate, endDate, baseDate, context)
  if (hasPendingChurnHistory && typeof hasPendingChurnHistory === "object") {
    context = hasPendingChurnHistory;
    hasPendingChurnHistory = Boolean(
      context.hasPendingChurnHistory ?? context.hasActivePendingChurn,
    );
  }

  const propStatus = String(
    context.property_status || context.propertyStatus || context.propertyStatuses || "",
  )
    .trim()
    .toLowerCase();
  const hotelStatus = String(
    context.hotel_status || context.hotelStatus || context.hotelStatuses || "",
  )
    .trim()
    .toLowerCase();
  const isUnitExplicitlyActive = propStatus === "active" && hotelStatus === "active";

  const isPendingChurnCancelled = Boolean(
    context.isPendingChurnCancelled ?? context.hasCancelledPendingChurn,
  );

  // Jika WO Pending Churn ("Dear Team Eng") sudah dicancel:
  // Unit TIDAK termasuk break contract (proses break contract dibatalkan)
  if (isPendingChurnCancelled && !hasPendingChurnHistory) {
    return false;
  }

  if (
    !breakDateValue ||
    breakDateValue === "—" ||
    breakDateValue === "-" ||
    breakDateValue === true
  )
    return false;
  const str = String(breakDateValue).trim();
  if (!str) return false;

  const breakDate = parseToMidnight(str);
  if (!breakDate) return false;

  // Jika bukan unit inactive, tidak ada pending churn aktif,
  // dan tanggal breakcontract_date sudah lewat di masa lalu sementara endcontract_date masih di masa depan:
  // Ini adalah tanggal break contract lama yang dibatalkan/sudah di-cancel
  const isInactive = propStatus === "inactive" || hotelStatus === "inactive";
  if (!isInactive && !hasPendingChurnHistory && endDateValue) {
    const endDate = parseToMidnight(endDateValue);
    const now = baseDate instanceof Date ? baseDate : new Date(baseDate);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (
      breakDate &&
      endDate &&
      breakDate.getTime() < todayMidnight.getTime() &&
      endDate.getTime() > todayMidnight.getTime()
    ) {
      return false;
    }
  }

  // Kondisi 3: jika breakcontract_date == endcontract_date → bukan break, itu CO normal
  if (endDateValue) {
    const endDate = parseToMidnight(endDateValue);
    if (endDate && breakDate.getTime() === endDate.getTime()) return false;
  }

  // Kondisi B (override): ada WO Pending Churn aktif di history room
  // → break contract meskipun tanggalnya belum lewat
  if (hasPendingChurnHistory) return true;

  const now = baseDate instanceof Date ? baseDate : new Date(baseDate);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Kondisi A: breakcontract_date <= hari ini → break sedang/sudah terjadi
  return breakDate.getTime() <= todayMidnight.getTime();
}

/**
 * Menghitung status notifikasi Break Contract:
 * - "upcoming": jika tanggal break contract jatuh besok (H-1 / sehari lagi)
 * - "broken": jika tanggal break contract hari ini / sudah lewat, atau isBreak bernilai true
 * - null: jika belum memasuki waktu break contract (> 1 hari) atau bukan break contract
 */
export function getBreakContractNotice(data, baseDate = new Date()) {
  if (!data) return null;

  const propStatus = String(data.property_status || data.propertyStatus || "")
    .trim()
    .toLowerCase();
  const hotelStatus = String(data.hotel_status || data.hotelStatus || "")
    .trim()
    .toLowerCase();
  const isUnitExplicitlyActive = propStatus === "active" && hotelStatus === "active";

  // Jika WO Pending Churn ("Dear Team Eng") sudah dicancel, maka BUKAN break contract
  if (data.isPendingChurnCancelled && !data.hasPendingChurnHistory) {
    return null;
  }

  // Jika sudah dievaluasi isBreakContract = false (dan tidak ada pending churn aktif)
  if (data.isBreakContract === false && !data.hasPendingChurnHistory) {
    return null;
  }

  const rawBreakDate = data.breakContractDate || data.breakcontract_date;
  const rawEndDate = data.endContractDate || data.endcontract_date;
  const isBreak = Boolean(data.isBreakContract ?? data.is_break_contract);

  const hasValidBreakDateStr =
    rawBreakDate && rawBreakDate !== "—" && rawBreakDate !== "-" && rawBreakDate !== true;

  if (hasValidBreakDateStr) {
    const targetBreakDate = parseToMidnight(rawBreakDate);
    if (targetBreakDate) {
      if (rawEndDate) {
        const targetEndDate = parseToMidnight(rawEndDate);
        if (targetEndDate && targetBreakDate.getTime() === targetEndDate.getTime()) {
          return null;
        }
      }

      const now = baseDate instanceof Date ? baseDate : new Date(baseDate);
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const diffMs = targetBreakDate.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Sehari lagi (misal: hari ini 31-10-2026, break besok 01-11-2026 -> diffDays === 1)
      if (diffDays === 1) {
        return {
          type: "upcoming",
          label: "Akan break contract pada:",
          date: fmtDate(rawBreakDate),
        };
      }

      // Jika bukan unit inactive, tidak ada pending churn aktif,
      // dan break contract date di masa lalu (diffDays <= 0) sementara end contract date masih di masa depan:
      // Ini adalah bekas tanggal break contract lama yang dibatalkan/di-cancel!
      const isInactive = propStatus === "inactive" || hotelStatus === "inactive";
      if (diffDays <= 0 && !isInactive && !data.hasPendingChurnHistory && rawEndDate) {
        const targetEndDate = parseToMidnight(rawEndDate);
        if (targetEndDate && targetEndDate.getTime() > todayMidnight.getTime()) {
          return null;
        }
      }

      // Sudah masuk tanggal break contract atau lewat (diffDays <= 0)
      if (diffDays <= 0) {
        return {
          type: "broken",
          label: "Break Contract:",
          date: fmtDate(rawBreakDate),
        };
      }

      // Belum memasuki waktu break contract (diffDays > 1)
      if (isBreak) {
        return {
          type: "broken",
          label: "Break Contract:",
          date: fmtDate(rawBreakDate),
        };
      }

      return null;
    }
  }

  // Jika tidak ada string tanggal tapi isBreak bernilai true (misal hasPendingChurnHistory)
  if (isBreak) {
    return {
      type: "broken",
      label: "Break Contract:",
      date: "Yes",
    };
  }

  return null;
}

export function normalizeWorkOrder(item, index = 0) {
  const rawBreakContractDate = first(
    item.breakcontract_date,
    item.breakContractDate,
    item.break_contract_date,
    item.breakcontractDate,
    null,
  );

  const rawEndContractDate = first(
    item.endcontract_date,
    item.endContractDate,
    item.end_contract_date,
    item.endcontractDate,
    null,
  );

  return {
    id: String(
      first(item._id, item.id, item.wo_id, item.workOrderId, item.wo_no, item.woNumber, index),
    ),
    woNumber: first(item.wo_no, item.woNumber, item.wo_number, item.no_wo, item.code),
    actionDate: first(item.actionDate, item.action_date),
    towerName: first(item.towername, item.towerName, item.tower_name, item.tower),
    roomName: first(item.roomname, item.roomName, item.room_name, item.room),
    roomCode: first(item.roomcode, item.roomCode, item.room_code),
    foRoomsId: first(item.fo_rooms_id, item.foRoomsId),
    type: first(item.woType, item.wo_type, item.type),
    gcType: first(item.gc_type, item.gcType, item.gc_type_name),
    subType: first(item.woSubType, item.wo_sub_type, item.sub_type),
    priority: first(item.priority, "Normal"),
    status: normalizeStatus(first(item.wo_status, item.status_name, item.statusName, item.status)),
    woStatus: first(item.wo_status, item.woStatus, item.status_name, item.status, "New"),
    engineer: first(item.currentEngineerName, item.engineerName, item.engineer_name, item.engineer),
    cluster: first(item.clusterName, item.cluster_name, item.cluster?.name, item.cluster),
    clusterId: first(item.cluster_id?._id, item.cluster_id, item.clusterId),
    department: item.department_in_charge ?? item.department ?? item.departmentInCharge ?? "-",
    remark: first(item.note, item.remark, item.notes, item.description),
    createdDate: first(item.createdDate, item.created_date, item.created_at),
    article: first(
      item.wo_articles,
      item.woArticles,
      item.wo_article,
      item.article,
      item.article_name,
      item.articles,
    ),
    roomStatus: first(item.roomstatuses_name, item.roomStatus, item.room_status),
    latestReservation: item.latestReservation || null,
    otaBookNumber: first(item.ota_book_number, item.otaBookNumber, item.co_ota_book_number),
    // futureBookNumber: strictly dari ota_book_number saja (bukan co_ota_book_number).
    // Digunakan untuk matching future reservation — co_ota_book_number adalah booking
    // current guest yang sedang CO, bukan booking tamu berikutnya.
    futureBookNumber: item.ota_book_number || item.futureBookNumber || null,
    coOtaBookNumber: first(item.co_ota_book_number, item.coOtaBookNumber, null),
    reffBookingId: first(item.reff_booking_id, item.reffBookingId, null),
    rawCoDate: first(item.co_date, item.coDate, null),
    rawCiDate: first(item.ci_date, item.ciDate, null),
    ciDate: first(item.ci_date, item.ciDate),
    coDate: first(item.co_date, item.coDate),
    isInHouse: first(item.is_in_house, item.isInHouse, "no"),
    isGuestAppointment: first(
      item.is_guestAppointment,
      item.is_guest_appointment,
      item.isGuestAppointment,
      item.is_guestappointment,
      "yes",
    ),
    startValidDate: first(item.startValidDate, item.start_valid_date),
    endValidDate: first(item.endValidDate, item.end_valid_date),
    closeOutDate: first(item.closeOutDate, item.close_out_date),
    assignmentStatus: first(item.assignmentStatus, item.assignment_status, "Assigned"),
    createdUser: first(item.created_user, item.createdUser, item.createdBy, item.created_by),
    tracingSchedule: Array.isArray(item.tracingSchedule)
      ? item.tracingSchedule
      : Array.isArray(item.tracing_schedule)
        ? item.tracing_schedule
        : [],
    tracingId: first(
      item.reservationtraces_id,
      item.tracingSchedule?.[0]?.id,
      item.tracing_schedule?.[0]?.id,
      item.tracingId,
    ),
    reservationtraces_status:
      item.reservationtraces_status ||
      item.reservationtracesStatus ||
      item.reservationtrace_status ||
      item.traces_status ||
      item.tracingSchedule?.[0]?.status ||
      item.tracing_schedule?.[0]?.status ||
      "",
    rejected_wo_guarantee_date:
      item.rejected_wo_guarantee_date ||
      item.rejectedWoGuaranteeDate ||
      item.tracingSchedule?.[0]?.rejected_wo_guarantee_date ||
      item.tracing_schedule?.[0]?.rejected_wo_guarantee_date ||
      null,
    oldRoomName: first(item.oldroomname, item.old_roomname, item.roomnumber, ""),
    isIncludeCloseOut: Number(
      first(
        item.isIncludeCloseOut,
        item.is_include_close_out,
        item.is_include_closeout,
        item.isIncludeCloseout,
        item.includeCloseOut,
        0,
      ),
    ),
    isWoManageByOwner: Number(
      first(
        item.isWoManageByOwner,
        item.is_wo_manage_by_owner,
        item.wo_manage_by_owner,
        item.woManageByOwner,
        0,
      ),
    ),
    postChargeList: Array.isArray(item.postChargeList)
      ? item.postChargeList
      : Array.isArray(item.post_charge_list)
        ? item.post_charge_list
        : [],
    postChargeListLength: Number(
      first(
        item.postChargeListLength,
        item.post_charge_list_length,
        Array.isArray(item.postChargeList) ? item.postChargeList.length : 0,
        Array.isArray(item.post_charge_list) ? item.post_charge_list.length : 0,
        0,
      ),
    ),
    propertyStatus: first(
      item.property_status,
      item.propertyStatus,
      item.property_statuses,
      "Active",
    ),
    property_status: first(
      item.property_status,
      item.propertyStatus,
      item.property_statuses,
      "Active",
    ),
    hotelStatus: first(item.hotel_status, item.hotelStatus, item.hotel_statuses, "active"),
    hotel_status: first(item.hotel_status, item.hotelStatus, item.hotel_statuses, "active"),
    isPendingChurnCancelled: Boolean(item.isPendingChurnCancelled),
    endContractDate: rawEndContractDate,
    breakContractDate: rawBreakContractDate,
    hasPendingChurnHistory: Boolean(item.hasPendingChurnHistory), // akan di-enrich di server route jika ada breakcontract_date
    isBreakContract: checkIsBreakContract(
      rawBreakContractDate,
      rawEndContractDate,
      new Date(),
      Boolean(item.hasPendingChurnHistory),
      {
        propertyStatus: first(
          item.property_status,
          item.propertyStatus,
          item.property_statuses,
          "Active",
        ),
        hotelStatus: first(item.hotel_status, item.hotelStatus, item.hotel_statuses, "active"),
        isPendingChurnCancelled: Boolean(item.isPendingChurnCancelled),
      },
    ),
  };
}

export function normalizeWorkOrderResponse(response) {
  const root = response?.data ?? response ?? {};
  const candidates = [
    root.payload?.data,
    root.payload,
    root.data,
    root.rows,
    root.result,
    root.list,
    root,
  ];
  const rows = candidates.find(Array.isArray) || [];
  const total = Number(
    root.total ?? root.count ?? root.totalData ?? root.payload?.totalData ?? rows.length,
  );
  return { rows: rows.map(normalizeWorkOrder), total };
}

// department_in_charge values, other than "engineering", that are fetched in parallel
export const EXTRA_DEPARTMENT_QUERIES = ["-", "Unassigned", "traveliomart", "operational"];

export function isAddOnsWorkOrder(row) {
  if (!row) return false;
  const type = String(row.type ?? "")
    .trim()
    .toLowerCase();
  const remark = String(row.remark ?? "")
    .trim()
    .toLowerCase();

  if (
    type === "additional item" ||
    remark.includes("add ons") ||
    remark.includes("addon") ||
    remark.includes("add-on")
  ) {
    return true;
  }

  if (Array.isArray(row.tracingSchedule)) {
    const hasTracingAddon = row.tracingSchedule.some((schedule) => {
      const scheduleType = String(schedule?.type ?? schedule?.wo_type ?? schedule?.woType ?? "")
        .trim()
        .toLowerCase();
      const scheduleNote = String(schedule?.note ?? schedule?.remark ?? schedule?.description ?? "")
        .trim()
        .toLowerCase();
      const createSource = String(schedule?.create_source ?? schedule?.createSource ?? "")
        .trim()
        .toLowerCase();

      return (
        scheduleType === "additional item" ||
        scheduleNote.includes("add ons") ||
        scheduleNote.includes("addon") ||
        scheduleNote.includes("add-on") ||
        createSource === "travelio app"
      );
    });

    if (hasTracingAddon) return true;
  }

  return false;
}

export function isCleaningAcAdditionalItem(row) {
  const type = String(row?.type ?? "")
    .trim()
    .toLowerCase();
  const gcType = String(row?.gcType ?? "")
    .trim()
    .toLowerCase();
  return isAddOnsWorkOrder(row) && (gcType === "cleaning ac" || type === "additional item");
}

// Combines the "engineering" result set with the extra department_in_charge
// result sets (e.g. "-", "Unassigned", "traveliomart", "operational"), keeping extra rows
// when they are Add Ons (for '-' / 'Unassigned') or Guest Appointments (for 'traveliomart' / 'operational'),
// and de-duplicates by id.
export function mergeWorkOrderRows(engineeringRows, extraRowSets = []) {
  const merged = [...engineeringRows];
  const seen = new Set(engineeringRows.map((row) => row.id));
  extraRowSets.flat().forEach((row) => {
    if (!seen.has(row.id)) {
      const dept = String(row.department || "")
        .trim()
        .toLowerCase();
      const isGuestAppt =
        String(row.isGuestAppointment ?? "yes")
          .trim()
          .toLowerCase() !== "no";
      const isDirectApptDept =
        dept.includes("traveliomart") ||
        dept.includes("mart") ||
        dept.includes("operational") ||
        dept.includes("operation") ||
        !dept ||
        dept === "-" ||
        dept === "—" ||
        dept.includes("unassigned");

      if (isDirectApptDept ? isGuestAppt : isAddOnsWorkOrder(row)) {
        seen.add(row.id);
        merged.push(row);
      }
    }
  });
  return merged;
}

export function getDepartmentCategory(department) {
  if (department === null || department === undefined) return "Unassigned / null";
  const dept = String(department).trim().toLowerCase();
  if (
    !dept ||
    dept === "null" ||
    dept === "none" ||
    dept === "-" ||
    dept === "—" ||
    dept.includes("unassigned")
  ) {
    return "Unassigned / null";
  }
  if (dept.includes("engineer")) return "Engineering";
  if (dept === "orm" || dept.includes("room management") || dept.includes("operation room")) {
    return "ORM";
  }
  if (dept.includes("traveliomart") || dept.includes("mart")) return "Traveliomart";
  if (dept === "cs" || dept.includes("customer service")) return "CS";
  if (dept.includes("operational") || dept === "operation") return "Operational";
  if (dept.includes("technical") || dept.includes("auditor") || dept === "ta") {
    return "Technical Auditor";
  }
  if (dept.includes("inventory") || dept.includes("admin")) return "Admin Inventory";
  return "Other";
}

export function getRoomStatusCategory(roomStatus) {
  const status = String(roomStatus || "")
    .trim()
    .toLowerCase();
  if (status.includes("major")) return "Major";
  if (status.includes("minor")) return "Minor";
  return "No Status";
}

export function calculateDicStats(rows = []) {
  const stats = {
    Total: rows.length,
    Engineering: 0,
    ORM: 0,
    Traveliomart: 0,
    CS: 0,
    Operational: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
  };

  rows.forEach((row) => {
    const category = getDepartmentCategory(row.department);
    if (category === "Engineering") stats.Engineering += 1;
    else if (category === "ORM") stats.ORM += 1;
    else if (category === "Traveliomart") stats.Traveliomart += 1;
    else if (category === "CS") stats.CS += 1;
    else if (category === "Operational") stats.Operational += 1;
    else if (category === "Technical Auditor") stats.TechnicalAuditor += 1;
    else if (category === "Admin Inventory") stats.AdminInventory += 1;
    else if (category === "Unassigned / null" || category === "Unassigned") stats.Unassigned += 1;
    else stats.Unassigned += 1;

    const roomCat = getRoomStatusCategory(row.roomStatus);
    if (roomCat === "Major") stats.Major += 1;
    else if (roomCat === "Minor") stats.Minor += 1;
    else stats.NoRoomStatus += 1;
  });

  return stats;
}

export function calculateConflictStats(rows = []) {
  const genIds = new Set();
  const stats = {
    Total: rows.length,
    TotalUnit: 0,
    Assigned: 0,
    UnassignedEngineer: 0,
    New: 0,
    OnProgress: 0,
    Engineering: 0,
    Operational: 0,
    Traveliomart: 0,
    AdminInventory: 0,
    ORM: 0,
    CS: 0,
    TechnicalAuditor: 0,
    Unassigned: 0,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
  };

  rows.forEach((row) => {
    const genId = String(
      row.roomCode || row.roomcode || row.room_code || row.genId || row.gen_id || "",
    ).trim();
    if (genId && genId !== "—" && genId !== "-") {
      genIds.add(genId);
    }

    const eng = String(row.engineer ?? "")
      .trim()
      .toLowerCase();
    const isUnassigned = !eng || eng === "—" || eng === "-" || eng.includes("unassigned");
    if (isUnassigned) {
      stats.UnassignedEngineer += 1;
    } else {
      stats.Assigned += 1;
    }

    const rawStatus = String(row.woStatus || row.status || "").toLowerCase();
    if (
      rawStatus.includes("progress") ||
      rawStatus === "active" ||
      rawStatus === "2" ||
      rawStatus === "on progress"
    ) {
      stats.OnProgress += 1;
    } else {
      stats.New += 1;
    }

    const category = getDepartmentCategory(row.department);
    if (category === "Engineering") stats.Engineering += 1;
    else if (category === "ORM") stats.ORM += 1;
    else if (category === "Traveliomart") stats.Traveliomart += 1;
    else if (category === "CS") stats.CS += 1;
    else if (category === "Operational") stats.Operational += 1;
    else if (category === "Technical Auditor") stats.TechnicalAuditor += 1;
    else if (category === "Admin Inventory") stats.AdminInventory += 1;
    else if (category === "Unassigned") stats.Unassigned += 1;
    else stats.Unassigned += 1;

    const roomCat = getRoomStatusCategory(row.roomStatus);
    if (roomCat === "Major") stats.Major += 1;
    else if (roomCat === "Minor") stats.Minor += 1;
    else stats.NoRoomStatus += 1;
  });

  stats.TotalUnit = genIds.size;
  return stats;
}

export function checkIsInHouse(row = {}) {
  const currentRes = row.activeReservation || row.latestReservation;
  const hasCurrent = Boolean(currentRes?.genId && String(currentRes.genId).trim() !== "");
  const hasFuture = Boolean(
    row.otaBookNumber &&
    String(row.otaBookNumber).trim() !== "" &&
    String(row.otaBookNumber).trim() !== "—",
  );

  // Rule 6: Both missing -> non in-house
  if (!hasCurrent && !hasFuture) {
    return false;
  }

  // Rule 2: Current only -> in-house
  if (hasCurrent && !hasFuture) {
    return true;
  }

  const parseDate = (val) => {
    if (!val) return null;
    const str = String(val).trim();
    if (/^\d{8}$/.test(str)) {
      const y = str.slice(0, 4);
      const m = str.slice(4, 6);
      const d = str.slice(6, 8);
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  // Rule 1: Both current and future exist
  if (hasCurrent && hasFuture) {
    const currentCO = parseDate(currentRes.checkoutDate || currentRes.checkinDate);
    const futureCI = parseDate(row.ciDate);

    if (currentCO && futureCI) {
      const coMidnight = new Date(
        currentCO.getFullYear(),
        currentCO.getMonth(),
        currentCO.getDate(),
      );
      const ciMidnight = new Date(futureCI.getFullYear(), futureCI.getMonth(), futureCI.getDate());
      const diffMs = Math.abs(ciMidnight.getTime() - coMidnight.getTime());
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        return true;
      }
    } else {
      return true;
    }
  }

  // Rule 3, 4, 5: Future exists (and no current, or current date diff > 1)
  if (hasFuture) {
    const futureCI = parseDate(row.ciDate);
    if (!futureCI) return false;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureCIMidnight = new Date(
      futureCI.getFullYear(),
      futureCI.getMonth(),
      futureCI.getDate(),
    );

    // Rule 5: Belum CI (future CI date is after today) -> non in-house
    if (futureCIMidnight.getTime() > todayMidnight.getTime()) {
      return false;
    }

    // Already checked in on past day -> in-house
    if (futureCIMidnight.getTime() < todayMidnight.getTime()) {
      return true;
    }

    // Future CI date is TODAY:
    // Rule 3: Sudah lewat jam 14.00 -> in-house
    // Rule 4: Belum lewat jam 14.00 -> non in-house
    return now.getHours() >= 14;
  }

  return false;
}

import {
  generateAgingReport,
  generateAppointmentReport,
  generateConflictReport,
  generateCreatedTodayReport,
} from "./reports";

export {
  calculateAgingStats,
  createAgingPayload,
  defaultAgingDateRange,
} from "@/modules/aging/lib";

export {
  generateAgingReport,
  generateAppointmentReport,
  generateConflictReport,
  generateCreatedTodayReport,
  generateCreatedTodayReport as generateWorkOrderReport,
};
