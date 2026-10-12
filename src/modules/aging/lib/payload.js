// ============================================================================
// LIB / API — /dashboard/aging (Payload & Default Range)
// Purpose: Aging work orders payload generator and default 4-days-back date range
// ============================================================================

import { addDays, format } from "date-fns";
import {
  EXCLUDED_CONFLICT_ARTICLES,
  isExcludedConflictArticle,
  today,
  yesterday,
} from "@/modules/shared/work-orders/lib";

export { EXCLUDED_CONFLICT_ARTICLES, isExcludedConflictArticle };
export { isExcludedConflictArticle as isExcludedAgingArticle };

/**
 * Generate default date range for Aging work orders:
 * - from: 4 days before today (format yyyy-MM-dd)
 * - to: yesterday (format yyyy-MM-dd)
 */
export function defaultAgingDateRange(baseDate = new Date()) {
  return {
    from: format(addDays(baseDate, -4), "yyyy-MM-dd"),
    to: format(addDays(baseDate, -1), "yyyy-MM-dd"),
  };
}

/**
 * Generate request payload for Aging Work Orders.
 * POST https://liohd.travelio.com/v1/api/listWONewSedangDiRefactor
 */
export function createAgingPayload(filters = {}) {
  const defaultRange = defaultAgingDateRange();
  const tDate = today();

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
    from_date: filters.dateFrom || filters.fromDate || filters.from_date || defaultRange.from,
    to_date: filters.dateTo || filters.toDate || filters.to_date || defaultRange.to,
    skipCountPaging: 0,
    poStatus: filters.poStatus || "",
    pos_date: filters.posDate || filters.pos_date || tDate,
    limit: filters.limit !== undefined && filters.limit !== null ? String(filters.limit) : "",
    offset: Number(filters.offset || 0),
    sortBy: filters.sortBy || "",
    sortDirection: filters.sortDirection || "",
  };
}
