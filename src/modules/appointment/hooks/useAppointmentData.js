"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { QUERY_STALE_MS, useAutoRefreshInterval } from "@/lib/config/refresh";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useAppointmentData() {
  const defaultDate = useMemo(() => tomorrow(), []);
  const [dateRange, setDateRange] = useState({ from: defaultDate, to: defaultDate });
  const [selectedClusters, setSelectedClusters] = useState([]);
  const knownIds = useRef(new Set());
  const refetchInterval = useAutoRefreshInterval();

  const query = useQuery({
    queryKey: ["workorders", dateRange.from, dateRange.to],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: { all: 1, dateFrom: dateRange.from, dateTo: dateRange.to },
        })
      ).data,
    staleTime: QUERY_STALE_MS,
    refetchInterval,
  });

  useEffect(() => {
    if (!query.data?.rows) return;
    const nextIds = query.data.rows.map((row) => row.id);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount) toast.add({ type: "info", title: `${newCount} new work order(s) received.` });
    }
    knownIds.current = new Set(nextIds);
  }, [query.data]);

  const rows = query.data?.rows || EMPTY_ROWS;

  const clusterFilteredRows = useMemo(() => {
    if (!selectedClusters.length) return rows;
    return rows.filter((row) => selectedClusters.includes(row.cluster));
  }, [rows, selectedClusters]);

  const stats = useMemo(() => {
    const res = { New: 0, Active: 0, Completed: 0, Pending: 0 };
    clusterFilteredRows.forEach((row) => {
      res[row.status] = (res[row.status] || 0) + 1;
    });
    return res;
  }, [clusterFilteredRows]);

  return {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
    stats,
  };
}
