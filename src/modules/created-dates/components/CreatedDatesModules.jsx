"use client";

import { useMemo } from "react";
import { useCreatedDatesData } from "../hooks/useCreatedDatesData";
import { CreatedDatesHeader } from "./CreatedDatesHeader";
import { CreatedDatesStats } from "./CreatedDatesStats";
import { CreatedDatesTable } from "./CreatedDatesTable";
import { CreatedDatesPreviewReports } from "./CreatedDatesPreviewReports";

export const CreatedDatesModules = () => {
  const { query, rows, todayDate, selectedClusters, setSelectedClusters, stats } =
    useCreatedDatesData();

  const dateRange = useMemo(() => ({ from: todayDate, to: todayDate }), [todayDate]);

  return (
    <div className="space-y-4">
      <CreatedDatesHeader query={query} />
      <CreatedDatesStats stats={stats} />
      <CreatedDatesTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
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
