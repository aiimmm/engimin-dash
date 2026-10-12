"use client";

import { AgingHeader } from "./AgingHeader";
import { AgingPreviewReports } from "./AgingPreviewReports";
import { AgingStats } from "./AgingStats";
import { AgingTable } from "./AgingTable";
import { useAgingData } from "../hooks/useAgingData";

export const AgingModules = () => {
  const {
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
    stats,
    handleSyncSheet,
  } = useAgingData();

  return (
    <div className="space-y-4">
      <AgingHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        query={query}
        onSyncSheet={() => handleSyncSheet(true)}
        isSyncing={isSyncing}
        isAutoRefreshPaused={isAutoRefreshPaused}
        onToggleAutoRefresh={toggleAutoRefresh}
      />
      <AgingStats stats={stats} />
      <AgingTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
      />
      <AgingPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        selectedDics={selectedDics}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AgingModules;
