"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { QUERY_STALE_MS, useAutoRefreshInterval } from "@/lib/config/refresh";
import { calculateAgingStats, defaultAgingDateRange } from "@/modules/aging/lib";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useAgingData() {
  const initialDateRange = useMemo(() => defaultAgingDateRange(), []);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [selectedDics, setSelectedDics] = useState([]);
  const knownIds = useRef(new Set());
  const refetchInterval = useAutoRefreshInterval();

  const query = useQuery({
    queryKey: ["workorders-aging", dateRange.from, dateRange.to],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: {
            all: 1,
            aging: 1,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
          },
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
      if (newCount)
        toast.add({ type: "info", title: `${newCount} new aging work order(s) found.` });
    }
    knownIds.current = new Set(nextIds);
  }, [query.data]);

  const rows = query.data?.rows || EMPTY_ROWS;

  const filteredRows = useMemo(() => {
    let result = rows;
    if (selectedClusters.length > 0) {
      result = result.filter((row) => selectedClusters.includes(row.cluster));
    }
    if (selectedDics.length > 0) {
      result = result.filter((row) => {
        const cat = getDepartmentCategory(row.department);
        return selectedDics.includes(cat);
      });
    }
    return result;
  }, [rows, selectedClusters, selectedDics]);

  const stats = useMemo(() => calculateAgingStats(filteredRows), [filteredRows]);

  return {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    selectedDics,
    setSelectedDics,
    query,
    rows,
    filteredRows,
    stats,
  };
}
