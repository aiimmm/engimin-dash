"use client";

import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { useEngineerMonitoringData } from "../hooks/useEngineerMonitoringData";
import { compareRiClusters } from "../lib";
import { EngineerMonitoringHeader } from "./EngineerMonitoringHeader";
import { EngineerMonitoringStats } from "./EngineerMonitoringStats";
import { EngineerRejectedScheduleReport } from "./EngineerRejectedScheduleReport";
import { EngineerTotalTaskTable } from "./EngineerTotalTaskTable";
import { TopRankAdminCompletes } from "./TopRankAdminCompletes";

export const EngineerMonitoringModules = () => {
  const {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    selectedDics,
    setSelectedDics,
    selectedEngStatuses,
    selectedWoStatuses,
    query,
    summary,
    tasks,
    completedTasks,
    internalEngineers,
    vendorEngineers,
    synchronizedEngineerTotals,
  } = useEngineerMonitoringData();

  // Extract unique cluster names from tasks & completedTasks
  const clusters = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      const c = String(t.cluster || t.cluster_name || "").trim();
      if (c && c !== "—" && c !== "-") set.add(c);
    });
    completedTasks.forEach((t) => {
      const c = String(t.cluster || "").trim();
      if (c && c !== "—" && c !== "-") set.add(c);
    });
    return Array.from(set).sort(compareRiClusters);
  }, [tasks, completedTasks]);

  return (
    <div className="space-y-4">
      <EngineerMonitoringHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        query={query}
        selectedClusters={selectedClusters}
        setSelectedClusters={setSelectedClusters}
        clusters={clusters}
        isLoadingClusters={query.isLoading}
      />

      <EngineerMonitoringStats
        summary={summary}
        tasks={tasks}
        completedTasks={completedTasks}
        internalEngineers={internalEngineers}
        vendorEngineers={vendorEngineers}
        selectedClusters={selectedClusters}
        selectedDics={selectedDics}
        selectedEngStatuses={selectedEngStatuses}
        selectedWoStatuses={selectedWoStatuses}
      />

      <Separator className="my-6" />

      <EngineerTotalTaskTable
        engineerTotals={synchronizedEngineerTotals}
        query={query}
        internalEngineers={internalEngineers}
        vendorEngineers={vendorEngineers}
      />

      <Separator className="-mt-1 mb-6" />

      <TopRankAdminCompletes completedTasks={completedTasks} isLoading={query.isLoading} />

      <Separator className="my-6" />

      <EngineerRejectedScheduleReport
        tasks={tasks}
        date={dateRange.from}
        dateTo={dateRange.to}
        selectedClusters={selectedClusters}
      />
    </div>
  );
};

export default EngineerMonitoringModules;
