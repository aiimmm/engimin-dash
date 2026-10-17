"use client";

import { ScrollButtons } from "@/components/ui/scroll-buttons";
import { Separator } from "@/components/ui/separator";
import { useActionDatesData } from "../hooks/useActionDatesData";
import { ActionDatesHeader } from "./ActionDatesHeader";
import { ActionDatesStats } from "./ActionDatesStats";
import { ActionDatesTable } from "./ActionDatesTable";

export const ActionDatesModules = () => {
  const {
    dateRange,
    setDateRange,
    selectedClusters,
    setSelectedClusters,
    query,
    rows,
    clusterFilteredRows,
  } = useActionDatesData();

  return (
    <div className="space-y-4">
      <ActionDatesHeader query={query} dateRange={dateRange} setDateRange={setDateRange} />
      <ActionDatesStats rows={clusterFilteredRows} />
      <Separator className="my-6" />
      <ActionDatesTable
        rows={rows}
        query={query}
        dateRange={dateRange}
        selectedClusters={selectedClusters}
        onSelectedClustersChange={setSelectedClusters}
      />
      <ScrollButtons bottom="bottom-6" right="right-6" />
    </div>
  );
};

export default ActionDatesModules;
