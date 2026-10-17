"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/modules/shared/work-orders";
import { CalendarSyncIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TriangleAlertIcon } from "lucide-react";
import { ActionDatesColumns } from "./ActionDatesColumns";

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:w-[40%] lg:max-w-sm" />
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <Skeleton className="h-9 w-full sm:w-auto lg:w-28" />
            <Skeleton className="h-9 w-full sm:w-auto lg:w-28" />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <Skeleton className="h-9 w-full sm:w-auto lg:w-28" />
            <Skeleton className="h-9 w-full sm:w-auto lg:w-28" />
            <Skeleton className="col-span-2 lg:col-span-1 h-9 w-full sm:w-auto lg:w-28" />
          </div>
        </div>
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton className="h-12 w-full" key={index} />
      ))}

      <div className="flex flex-col items-center justify-between py-4 sm:flex-row gap-4">
        <Skeleton className="h-4 sm:w-1/5 w-1/8" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </div>
  );
}

export const ActionDatesTable = ({
  rows,
  query,
  dateRange,
  selectedClusters,
  onSelectedClustersChange,
}) => {
  // Label rentang tanggal — tampilkan satu tanggal jika from=to, rentang jika berbeda
  const dateLabel = dateRange?.from
    ? dateRange.to && dateRange.to !== dateRange.from
      ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
      : formatDate(dateRange.from)
    : null;

  // Label cluster — spesifik jika ada pilihan, "seluruh cluster" jika tidak
  const clusterLabel =
    selectedClusters?.length > 0 ? selectedClusters.join(", ") : "seluruh cluster";

  return (
    <div>
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={CalendarSyncIcon} className="size-5" />
          Action Dates Work Orders {dateLabel && <>{dateLabel}</>}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Work orders yang dijadwalkan kemarin berdasarkan action dates di{" "}
          <span className={selectedClusters?.length > 0 ? "uppercase" : ""}>{clusterLabel}</span>.
        </CardDescription>
      </div>

      <CardContent className="mt-4 p-0">
        {query.isLoading ? (
          <LoadingTable />
        ) : query.isError ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <TriangleAlertIcon className="mx-auto size-10 text-destructive" />
              <p className="mt-4 font-semibold">Failed to load data</p>
              <p className="mt-1 text-sm text-muted-foreground">{query.error.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={ActionDatesColumns}
            dateRange={dateRange}
            hideReportAndExport={true}
            showInHouseFilter={true}
            showRoomStatusFilter={true}
            showCloseOutFilter={true}
            showWoStatusFilter={true}
            showEngineerFilter={true}
            showDicFilter={true}
            showWoManageByOwnerFilter={true}
            showPostChargeFilter={true}
            showBreakContractFilter={true}
            showMoveButton={true}
            selectedClusters={selectedClusters}
            onSelectedClustersChange={onSelectedClustersChange}
          />
        )}
      </CardContent>
    </div>
  );
};
