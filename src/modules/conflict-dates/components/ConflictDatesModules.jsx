"use client";

import { ConflictDatesHeader } from "./ConflictDatesHeader";
import { ConflictDatesPreviewReports } from "./ConflictDatesPreviewReports";
import { ConflictDatesStats } from "./ConflictDatesStats";
import { ConflictDatesTable } from "./ConflictDatesTable";
import { useConflictDatesData } from "../hooks/useConflictDatesData";

export const ConflictDatesModules = () => {
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
    filteredRows,
    stats,
    handleSyncSheet,
  } = useConflictDatesData();

  return (
    <div className="space-y-4">
      <ConflictDatesHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        query={query}
        onSyncSheet={() => handleSyncSheet(true)}
        isSyncing={isSyncing}
        isAutoRefreshPaused={isAutoRefreshPaused}
        onToggleAutoRefresh={toggleAutoRefresh}
      />
      <ConflictDatesStats stats={stats} />
      <ConflictDatesTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
      />
      <ConflictDatesPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        dateRange={dateRange}
      />
    </div>
  );
};

export default ConflictDatesModules;
