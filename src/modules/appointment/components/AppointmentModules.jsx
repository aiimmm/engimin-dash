"use client";

import { AppointmentHeader } from "./AppointmentHeader";
import { AppointmentPreviewReports } from "./AppointmentPreviewReports";
import { AppointmentStats } from "./AppointmentStats";
import { AppointmentTable } from "./AppointmentTable";
import { useAppointmentData } from "../hooks/useAppointmentData";

export const AppointmentModules = () => {
  const {
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
  } = useAppointmentData();

  return (
    <div className="space-y-4">
      <AppointmentHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        query={query}
        onSyncSheet={() => handleSyncSheet(true)}
        isSyncing={isSyncing}
      />
      <AppointmentStats rows={clusterFilteredRows} stats={stats} />
      <AppointmentTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
      <AppointmentPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AppointmentModules;
