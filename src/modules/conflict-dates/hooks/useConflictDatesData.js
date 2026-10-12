"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { defaultAgingDateRange } from "@/modules/aging/lib";
import { getConflictDateRangeForSync } from "@/modules/appointment/lib";
import {
  calculateConflictDatesStats,
  defaultConflictDatesRange,
} from "@/modules/conflict-dates/lib";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY_ROWS = [];

export function useConflictDatesData() {
  const initialDateRange = useMemo(() => defaultConflictDatesRange(), []);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [selectedDics, setSelectedDics] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const knownIds = useRef(new Set());

  const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("conflict_dates_auto_refresh_paused") === "true";
    }
    return false;
  });

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshPaused((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("conflict_dates_auto_refresh_paused", String(next));
      }
      return next;
    });
  }, []);

  const query = useQuery({
    queryKey: ["workorders-conflict-dates", dateRange.from, dateRange.to],
    queryFn: async () =>
      (
        await apiClient.get("/workorders", {
          params: {
            all: 1,
            conflictDates: 1,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
          },
        })
      ).data,
    refetchInterval: isAutoRefreshPaused ? false : 180_000,
  });

  const handleSyncSheet = useCallback(
    async (showToast = true) => {
      setIsSyncing(true);
      try {
        const conflictRange = getConflictDateRangeForSync(dateRange.from);

        let appointmentRows = [];
        try {
          const appointmentRes = await apiClient.get("/workorders", {
            params: {
              all: 1,
              dateFrom: dateRange.from,
              dateTo: dateRange.from,
            },
          });
          appointmentRows = appointmentRes.data?.rows || [];
        } catch (e) {
          console.warn("Could not fetch appointment rows for sync:", e);
        }

        let conflictRows = query.data?.rows || [];
        if (dateRange.to !== conflictRange.to) {
          try {
            const conflictRes = await apiClient.get("/workorders", {
              params: {
                all: 1,
                conflictDates: 1,
                dateFrom: conflictRange.from,
                dateTo: conflictRange.to,
              },
            });
            if (Array.isArray(conflictRes.data?.rows) && conflictRes.data.rows.length > 0) {
              conflictRows = conflictRes.data.rows;
            }
          } catch (e) {
            console.warn("Could not fetch 1-week conflict rows for sync:", e);
          }
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
          appointmentRows: appointmentRows,
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
        console.error("Conflict sheet sync error:", err);
        if (showToast)
          toast.add({ type: "error", title: "Failed to sync work orders data to Google Sheets." });
      } finally {
        setIsSyncing(false);
      }
    },
    [query.data, dateRange.from, dateRange.to],
  );

  useEffect(() => {
    if (!query.data?.rows) return;
    const nextIds = query.data.rows.map((row) => row.id);
    if (knownIds.current.size) {
      const newCount = nextIds.filter((id) => !knownIds.current.has(id)).length;
      if (newCount)
        toast.add({ type: "info", title: `${newCount} new conflict date work order(s) found.` });
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

  const stats = useMemo(() => calculateConflictDatesStats(filteredRows), [filteredRows]);

  return {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    selectedDics,
    setSelectedDics,
    isSyncing,
    isAutoRefreshPaused,
    toggleAutoRefresh,
    query,
    rows,
    filteredRows,
    stats,
    handleSyncSheet,
  };
}
