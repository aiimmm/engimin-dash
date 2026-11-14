"use client";

import { Separator } from "@/components/ui/separator";
import { useAppointmentData } from "../hooks/useAppointmentData";
import { AppointmentHeader } from "./AppointmentHeader";
import { AppointmentPreviewReports } from "./AppointmentPreviewReports";
import { AppointmentStats } from "./AppointmentStats";
import { AppointmentTable } from "./AppointmentTable";

export const AppointmentModules = () => {
  const {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
    stats,
  } = useAppointmentData();

  return (
    <div className="space-y-4">
      <AppointmentHeader dateRange={dateRange} setDateRange={setDateRange} query={query} />
      <AppointmentStats rows={clusterFilteredRows} stats={stats} />
      <Separator className="my-6" />
      <AppointmentTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
      <Separator className="my-6" />
      <AppointmentPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AppointmentModules;
