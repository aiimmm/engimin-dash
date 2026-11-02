"use client";

import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useAllocationData() {
  const tomorrowDate = useMemo(() => tomorrow(), []);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const knownIds = useRef(new Set());

  const query = useQuery({
    queryKey: ["workorders-allocation", tomorrowDate],
    queryFn: async () =>
      (
        await apiClient.get("/allocation", {
          params: {
            dateFrom: tomorrowDate,
            dateTo: tomorrowDate,
          },
        })
      ).data,
    refetchInterval: 180_000,
  });

  useEffect(() => {
    if (!query.data?.data) return;
    const nextIds = query.data.data.map((row) => row.id || row.woNumber);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount)
        toast.add({ type: "info", title: `${newCount} new allocation work order(s) received.` });
    }
    knownIds.current = new Set(nextIds);
  }, [query.data]);

  const rows = query.data?.data || EMPTY_ROWS;

  const clusterFilteredRows = useMemo(() => {
    if (!selectedClusters.length) return rows;
    return rows.filter((row) => selectedClusters.includes(row.cluster));
  }, [rows, selectedClusters]);

  return {
    tomorrowDate,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
  };
}
