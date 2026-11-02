"use client";

import { Separator } from "@/components/ui/separator";
import { useCreatedDatesData } from "../hooks/useCreatedDatesData";
import { CreatedDatesHeader } from "./CreatedDatesHeader";
import { CreatedDatesPreviewReports } from "./CreatedDatesPreviewReports";
import { CreatedDatesStats } from "./CreatedDatesStats";
import { CreatedDatesTable } from "./CreatedDatesTable";

export const CreatedDatesModules = () => {
  const { query, rows, dateRange, setDateRange, selectedClusters, setSelectedClusters, stats } =
    useCreatedDatesData();

  return (
    <div className="space-y-4">
      <CreatedDatesHeader query={query} dateRange={dateRange} setDateRange={setDateRange} />
      <CreatedDatesStats stats={stats} selectedClusters={selectedClusters} />
      <Separator className="my-6" />
      <CreatedDatesTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
      <Separator className="my-6" />
      <CreatedDatesPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        dateRange={dateRange}
      />
    </div>
  );
};

export const CreatedTodayModules = CreatedDatesModules;
export default CreatedDatesModules;
