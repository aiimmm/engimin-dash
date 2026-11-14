"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { QUERY_STALE_MS, useAutoRefreshInterval } from "@/lib/config/refresh";
import { today, yesterday } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useActionDatesData() {
  const yesterdayDate = useMemo(() => yesterday(), []);
  const todayDate = useMemo(() => today(), []);

  // Default: kemarin s/d kemarin — auto-set setiap masuk halaman
  const [dateRange, setDateRange] = useState(() => ({
    from: yesterdayDate,
    to: yesterdayDate,
  }));

  const [selectedClusters, setSelectedClusters] = useState([]);
  const knownIds = useRef(new Set());
  const refetchInterval = useAutoRefreshInterval();

  const query = useQuery({
    queryKey: ["workorders-action-dates", dateRange.from, dateRange.to],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: {
            all: 1,
            actionDates: 1,
            dateFrom: dateRange.from,
            dateTo: dateRange.to || dateRange.from,
            posDate: todayDate,
          },
        })
      ).data,
    staleTime: QUERY_STALE_MS,
    refetchInterval,
    enabled: Boolean(dateRange.from),
  });

  useEffect(() => {
    if (!query.data?.rows) return;
    const nextIds = query.data.rows.map((row) => row.id);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount)
        toast.add({ type: "info", title: `${newCount} new action date work order(s) received.` });
    }
    knownIds.current = new Set(nextIds);
  }, [query.data]);

  const rows = query.data?.rows || EMPTY_ROWS;

  const clusterFilteredRows = useMemo(() => {
    if (!selectedClusters.length) return rows;
    return rows.filter((row) => selectedClusters.includes(row.cluster));
  }, [rows, selectedClusters]);

  return {
    yesterdayDate,
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
  };
}
