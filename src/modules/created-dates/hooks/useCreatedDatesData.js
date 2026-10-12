"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { calculateDicStats } from "@/modules/created-dates/lib";
import { today } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useCreatedDatesData() {
  const todayDate = useMemo(() => today(), []);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const dateRange = useMemo(() => ({ from: todayDate, to: todayDate }), [todayDate]);
  const knownIds = useRef(new Set());

  const query = useQuery({
    queryKey: ["workorders-created-today", todayDate],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: {
            all: 1,
            createdToday: 1,
            dateFrom: todayDate,
            dateTo: todayDate,
          },
        })
      ).data,
    refetchInterval: 180_000,
  });

  useEffect(() => {
    if (!query.data?.rows) return;
    const nextIds = query.data.rows.map((row) => row.id);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount)
        toast.add({ type: "info", title: `${newCount} new work order(s) created today.` });
    }
    knownIds.current = new Set(nextIds);
  }, [query.data]);

  const rows = query.data?.rows || EMPTY_ROWS;

  const clusterFilteredRows = useMemo(() => {
    if (!selectedClusters.length) return rows;
    return rows.filter((row) => selectedClusters.includes(row.cluster));
  }, [rows, selectedClusters]);

  const stats = useMemo(() => calculateDicStats(clusterFilteredRows), [clusterFilteredRows]);

  return {
    todayDate,
    dateRange,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
    stats,
  };
}
