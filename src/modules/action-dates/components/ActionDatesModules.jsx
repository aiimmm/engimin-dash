"use client";

import { ActionDatesHeader } from "./ActionDatesHeader";
import { ActionDatesStats } from "./ActionDatesStats";
import { ActionDatesTable } from "./ActionDatesTable";
import { useActionDatesData } from "../hooks/useActionDatesData";

export const ActionDatesModules = () => {
  const { yesterdayDate, selectedClusters, setSelectedClusters, query, rows, clusterFilteredRows } =
    useActionDatesData();

  return (
    <div className="space-y-4">
      <ActionDatesHeader query={query} />
      <ActionDatesStats rows={clusterFilteredRows} />
      <ActionDatesTable
        rows={rows}
        query={query}
        dateRange={{ from: yesterdayDate, to: yesterdayDate }}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
    </div>
  );
};

export default ActionDatesModules;
