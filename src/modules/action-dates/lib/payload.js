// ============================================================================
// LIB / API — /dashboard/action-dates (Payload Generator)
// Purpose: Payload generator for action dates work order queries
// Description: Queries work orders based on actionDate_from and actionDate_to
// ============================================================================

import { today, yesterday } from "@/modules/shared/work-orders/lib";

/**
 * Generate request payload for Action Dates Work Orders.
 */
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
