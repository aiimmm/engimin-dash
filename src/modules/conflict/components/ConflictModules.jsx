"use client";

import { Separator } from "@/components/ui/separator";
import { useConflictData } from "../hooks/useConflictData";
import { ConflictHeader } from "./ConflictHeader";
import { ConflictStats } from "./ConflictStats";
import { ConflictTable } from "./ConflictTable";

export const ConflictModules = () => {
  const {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    selectedDics,
    setSelectedDics,
    query,
    rows,
    filteredRows,
    stats,
  } = useConflictData();

  return (
    <div className="space-y-4">
      <ConflictHeader dateRange={dateRange} setDateRange={setDateRange} query={query} />
      <ConflictStats stats={stats} />
      <Separator className="my-6" />
      <ConflictTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
        selectedDics={selectedDics}
        onSelectedDicsChange={setSelectedDics}
      />
      {/* <ConflictPreviewReports
        rows={rows}
        selectedClusters={selectedClusters}
        dateRange={dateRange}
      /> */}
    </div>
  );
};

export default ConflictModules;
