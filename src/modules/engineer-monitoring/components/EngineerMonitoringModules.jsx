"use client";

import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { useEngineerMonitoringData } from "../hooks/useEngineerMonitoringData";
import { ClusterAverageRankings } from "./ClusterAverageRankings";
import { EngineerCompletedWoTable } from "./EngineerCompletedWoTable";
import { EngineerMonitoringHeader } from "./EngineerMonitoringHeader";
import { EngineerMonitoringStats } from "./EngineerMonitoringStats";
import { EngineerTaskTable } from "./EngineerTaskTable";
import { EngineerTotalTaskTable } from "./EngineerTotalTaskTable";

export const EngineerMonitoringModules = () => {
  const {
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
    return Array.from(set).sort((a, b) => a.localeCompare(b));
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

      <Separator className="my-6" />

      <ClusterAverageRankings
        completedTasks={completedTasks}
        query={query}
        selectedClusters={selectedClusters}
        selectedDics={selectedDics}
      />

      <EngineerTaskTable
        tasks={tasks}
        query={query}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
        selectedEngStatuses={selectedEngStatuses}
        onSelectedEngStatusesChange={setSelectedEngStatuses}
        selectedWoStatuses={selectedWoStatuses}
        onSelectedWoStatusesChange={setSelectedWoStatuses}
      />

      <EngineerCompletedWoTable
        completedTasks={completedTasks}
        query={query}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
      />
    </div>
  );
};

export default EngineerMonitoringModules;
