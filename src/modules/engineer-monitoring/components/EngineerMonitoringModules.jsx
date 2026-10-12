"use client";

import { ClusterAverageRankings } from "./ClusterAverageRankings";
import { EngineerCompletedWoTable } from "./EngineerCompletedWoTable";
import { EngineerMonitoringHeader } from "./EngineerMonitoringHeader";
import { EngineerMonitoringStats } from "./EngineerMonitoringStats";
import { EngineerTaskTable } from "./EngineerTaskTable";
import { EngineerTotalTaskTable } from "./EngineerTotalTaskTable";
import { useEngineerMonitoringData } from "../hooks/useEngineerMonitoringData";

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
    synchronizedEngineerTotals,
  } = useEngineerMonitoringData();

  return (
    <div className="space-y-4">
      <EngineerMonitoringHeader dateRange={dateRange} setDateRange={setDateRange} query={query} />

      <EngineerMonitoringStats
        summary={summary}
        tasks={tasks}
        selectedClusters={selectedClusters}
        selectedDics={selectedDics}
        selectedEngStatuses={selectedEngStatuses}
        selectedWoStatuses={selectedWoStatuses}
      />

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

      <EngineerTotalTaskTable engineerTotals={synchronizedEngineerTotals} query={query} />

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
