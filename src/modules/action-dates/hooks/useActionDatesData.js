"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { today, yesterday } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useActionDatesData() {
  const yesterdayDate = useMemo(() => yesterday(), []);
  const todayDate = useMemo(() => today(), []);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const knownIds = useRef(new Set());

  const query = useQuery({
    queryKey: ["workorders-action-dates", yesterdayDate],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: {
            all: 1,
            actionDates: 1,
            dateFrom: yesterdayDate,
            dateTo: yesterdayDate,
            posDate: todayDate,
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
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
  };
}
