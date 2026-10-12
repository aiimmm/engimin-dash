"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { defaultAgingDateRange } from "@/modules/aging/lib";
import { getConflictDateRangeForSync } from "@/modules/appointment/lib";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useAppointmentData() {
  const defaultDate = useMemo(() => tomorrow(), []);
  const [dateRange, setDateRange] = useState({ from: defaultDate, to: defaultDate });
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const knownIds = useRef(new Set());

  const query = useQuery({
    queryKey: ["workorders", dateRange.from, dateRange.to],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: { all: 1, dateFrom: dateRange.from, dateTo: dateRange.to },
        })
      ).data,
    refetchInterval: 180_000,
  });

  const handleSyncSheet = useCallback(
    async (showToast = true) => {
      if (!query.data?.rows) return;
      setIsSyncing(true);
      try {
        let conflictRows = [];
        const conflictRange = getConflictDateRangeForSync(dateRange.from);
        try {
          const conflictRes = await apiClient.get("/workorders", {
            params: {
              all: 1,
              conflictDates: 1,
              dateFrom: conflictRange.from,
              dateTo: conflictRange.to,
            },
          });
          conflictRows = conflictRes.data?.rows || [];
        } catch (e) {
          console.warn("Could not fetch conflict rows for sync:", e);
        }

        let agingRows = [];
        try {
          const agingRange = defaultAgingDateRange();
          const agingRes = await apiClient.get("/workorders", {
            params: {
              all: 1,
              aging: 1,
              dateFrom: agingRange.from,
              dateTo: agingRange.to,
            },
          });
          agingRows = agingRes.data?.rows || [];
        } catch (e) {
          console.warn("Could not fetch aging rows for sync:", e);
        }

        const res = await apiClient.post("/workorders/required-wo/sync-sheet", {
          date: dateRange.from,
          appointmentRows: query.data.rows,
          conflictRows: conflictRows,
          agingRows: agingRows,
        });

        if (showToast) {
          if (res.data?.configured === false) {
            toast.add({
              type: "info",
              title: `Sheet tab name prepared: "${res.data.sheetName}". Set REQUIRED_WO_SHEET_WEBHOOK_URL to enable live Google Sheets sync.`,
            });
          } else if (res.data?.success) {
            toast.add({
              type: "success",
              title: `Successfully synced ${res.data.totalRows} work orders (${res.data.appointmentCount || 0} Appointment, ${res.data.conflictCount || 0} CI Conflict, ${res.data.agingCount || 0} Aging) to Sheet tab "${res.data.sheetName}"!`,
            });
          } else {
            toast.add({
              type: "error",
              title: "Google Sheets sync failed. Please check Apps Script webhook URL.",
            });
          }
        }
      } catch (err) {
        console.error("Appointment, Conflict & Aging sheet sync error:", err);
        if (showToast)
          toast.add({ type: "error", title: "Failed to sync work orders data to Google Sheets." });
      } finally {
        setIsSyncing(false);
      }
    },
    [query.data, dateRange.from],
  );

  useEffect(() => {
    if (!query.data?.rows) return;
    const nextIds = query.data.rows.map((row) => row.id);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount) toast.add({ type: "info", title: `${newCount} new work order(s) received.` });
    }
    knownIds.current = new Set(nextIds);

    // Defer sync to avoid calling setState synchronously inside effect body
    const timeout = setTimeout(() => handleSyncSheet(false), 0);
    return () => clearTimeout(timeout);
  }, [query.data, handleSyncSheet]);

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
    isSyncing,
    query,
    rows,
    clusterFilteredRows,
    stats,
    handleSyncSheet,
  };
}
