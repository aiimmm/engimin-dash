"use client";

import { apiClient } from "@/lib/api/client";
import { QUERY_STALE_MS, useAutoRefreshInterval } from "@/lib/config/refresh";
import { getDepartmentCategory, today } from "@/modules/shared/work-orders/lib";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export const ALL_DICS = [
  "Engineering",
  "Operational",
  "Unassigned / null",
  "Traveliomart",
  "CS",
  "Technical Auditor",
  "ORM",
  "Admin Inventory",
];

export const DEFAULT_DICS = ["Engineering", "Operational", "Unassigned / null", "Traveliomart"];

export function matchEngineerStatus(rowStatus, selectedStatuses) {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  const status = String(rowStatus || "")
    .toLowerCase()
    .trim();
  return selectedStatuses.some((sel) => {
    const s = sel.toLowerCase();
    if (s === "arrived") return status.includes("arriv");
    if (s === "assign") return status.includes("assign") && !status.includes("unassign");
    if (s === "pending") return status.includes("pending");
    if (s === "rejected") return status.includes("reject") && !status.includes("guarantee");
    if (s === "completed") return status.includes("complete");
    return status.includes(s);
  });
}

export function matchWoStatus(rowStatus, selectedStatuses) {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  const status = String(rowStatus || "")
    .toLowerCase()
    .trim();
  return selectedStatuses.some((sel) => {
    const s = sel.toLowerCase();
    if (s === "new") return status === "new" || status === "1";
    if (s === "on progress")
      return status.includes("progress") || status === "active" || status === "2";
    if (s === "completed") return status.includes("complete") || status === "3" || status === "5";
    return status.includes(s);
  });
}

export const useEngineerMonitoringData = () => {
  const defaultDate = useMemo(() => today(), []);
  const [dateRange, setDateRange] = useState({ from: defaultDate, to: defaultDate });
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [selectedDics, setSelectedDics] = useState(DEFAULT_DICS);
  const [selectedEngStatuses, setSelectedEngStatuses] = useState([]);
  const [selectedWoStatuses, setSelectedWoStatuses] = useState([]);

  const refetchInterval = useAutoRefreshInterval();

  const query = useQuery({
    queryKey: ["engineer-monitoring", dateRange.from, dateRange.to],
    queryFn: async () => {
      const from = dateRange.from || today();
      const to = dateRange.to || from;
      const res = await apiClient.get("/engineer-monitoring", {
        params: {
          dateFrom: from,
          dateTo: to,
        },
        timeout: 0,
      });
      return res.data;
    },
    staleTime: QUERY_STALE_MS,
    refetchInterval,
  });

  const summary = useMemo(() => query.data?.summary || {}, [query.data?.summary]);
  const tasks = useMemo(() => query.data?.tasks || [], [query.data?.tasks]);
  const completedTasks = useMemo(
    () => query.data?.completedTasks || [],
    [query.data?.completedTasks],
  );
  const rawEngineerTotals = useMemo(
    () => query.data?.engineerTotals || [],
    [query.data?.engineerTotals],
  );
  const internalEngineers = useMemo(
    () => query.data?.internalEngineers || [],
    [query.data?.internalEngineers],
  );
  const vendorEngineers = useMemo(
    () => query.data?.vendorEngineers || [],
    [query.data?.vendorEngineers],
  );

  const synchronizedEngineerTotals = useMemo(() => {
    if (!tasks || tasks.length === 0) return rawEngineerTotals;

    const targetTasks = tasks.filter((row) => {
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      if (selectedEngStatuses.length > 0) {
        if (!matchEngineerStatus(row.engineer_status, selectedEngStatuses)) return false;
      }
      if (selectedWoStatuses.length > 0) {
        if (!matchWoStatus(row.status || row.wo_status, selectedWoStatuses)) return false;
      }
      return true;
    });

    const engineerMap = new Map();

    targetTasks.forEach((t) => {
      const name = t.fullname ? String(t.fullname).trim() : "UNASSIGNED";
      if (!engineerMap.has(name)) {
        engineerMap.set(name, {
          fullname: name,
          total_task: 0,
          units: new Set(),
          unitsCompleted: new Set(),
          total_uncompleted: 0,
          total_engineer_completed: 0,
          total_completed: 0,
        });
      }

      const eng = engineerMap.get(name);
      eng.total_task += 1;

      const unitKey = t.roomCode || t.unit || t.roomName || t.id;
      if (unitKey && unitKey !== "—") eng.units.add(unitKey);

      const engStatus = String(t.engineer_status || "")
        .toLowerCase()
        .trim();
      const woStatus = String(t.status || t.wo_status || "")
        .toLowerCase()
        .trim();

      const isWoCompleted =
        woStatus === "completed" ||
        woStatus === "complete" ||
        woStatus.includes("complete") ||
        woStatus === "3" ||
        woStatus === "5";

      const isEngineerComplete =
        Number(t.total_pre_completed || 0) > 0 ||
        t.isPreComplete === "1" ||
        t.isPreComplete === 1 ||
        t.isPreComplete === true ||
        t.is_precomplete === 1 ||
        t.is_pre_complete === 1 ||
        engStatus.includes("pre-complete") ||
        engStatus.includes("pre complete") ||
        engStatus.includes("precompleted") ||
        engStatus.includes("pre_complete") ||
        engStatus.includes("pre-completed") ||
        engStatus === "completed" ||
        engStatus === "complete" ||
        engStatus.includes("complete");

      if (isWoCompleted) {
        eng.total_completed += 1;
        if (unitKey && unitKey !== "—") eng.unitsCompleted.add(unitKey);
      } else {
        eng.total_uncompleted += 1;
      }

      if (isEngineerComplete) {
        eng.total_engineer_completed += 1;
      }
    });

    return Array.from(engineerMap.values()).map((eng) => ({
      fullname: eng.fullname,
      total_task: eng.total_task,
      total_unit: eng.units.size,
      total_uncompleted: eng.total_uncompleted,
      total_unit_completed: eng.unitsCompleted.size,
      total_engineer_completed: eng.total_engineer_completed,
      total_completed: eng.total_completed,
    }));
  }, [tasks, rawEngineerTotals, selectedClusters, selectedEngStatuses, selectedWoStatuses]);

  return {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    selectedDics,
    setSelectedDics,
    selectedEngStatuses,
    setSelectedEngStatuses,
    selectedWoStatuses,
    setSelectedWoStatuses,
    query,
    summary,
    tasks,
    completedTasks,
    internalEngineers,
    vendorEngineers,
    synchronizedEngineerTotals,
  };
};
