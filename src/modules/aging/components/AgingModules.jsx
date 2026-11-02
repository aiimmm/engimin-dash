"use client";

import { Separator } from "@/components/ui/separator";
import { useAgingData } from "../hooks/useAgingData";
import { AgingHeader } from "./AgingHeader";
import { AgingStats } from "./AgingStats";
import { AgingTable } from "./AgingTable";

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
      <Separator className="my-6" />
      <AgingTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
      />
      {/* <AgingPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        selectedDics={selectedDics}
        dateRange={dateRange}
      /> */}
    </div>
  );
};

export default AgingModules;
