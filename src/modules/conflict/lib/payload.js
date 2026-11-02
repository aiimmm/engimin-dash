// ============================================================================
// LIB / API — /dashboard/conflict (Payload & Article Filter)
// Purpose: Conflict payload builder and wo_articles exclusion filter
// Description: Prepares nextCI date ranges and filters out non-applicable articles
// ============================================================================

import { addDays, format } from "date-fns";
import { today, tomorrow } from "@/modules/shared/work-orders/lib";

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

/**
 * Generate request payload for Conflict Work Orders.
 * - nextCI_from_date: default 7 days ahead
 * - nextCI_to_date: default tomorrow
 * - pos_date: default today
 */
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
