"use client";

import { AllocationHeader } from "./AllocationHeader";
import { AllocationStats } from "./AllocationStats";
import { AllocationTable } from "./AllocationTable";
import { useAllocationData } from "../hooks/useAllocationData";

export const AllocationModules = () => {
  const { tomorrowDate, selectedClusters, setSelectedClusters, query, rows, clusterFilteredRows } =
    useAllocationData();

  return (
    <div className="space-y-4">
      <AllocationHeader query={query} />
      <AllocationStats rows={clusterFilteredRows} />
      <AllocationTable
        rows={rows}
        query={query}
        dateRange={{ from: tomorrowDate, to: tomorrowDate }}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
    </div>
  );
};

export default AllocationModules;
