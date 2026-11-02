"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/modules/shared/work-orders";
import { CalendarClockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TriangleAlertIcon } from "lucide-react";
import { AppointmentColumns } from "./AppointmentColumns";

function LoadingTable() {
  return (
    <div className="space-y-4">
      {/* Search & Columns */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 flex-1 rounded-full" />
        <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 min-w-0 max-w-full grow basis-[calc(50%-0.5rem)] justify-between gap-1.5 rounded-full text-xs transition-[color,background-color,box-shadow] lg:min-w-56 lg:flex-1 lg:basis-60"
            />
          ))}
        </div>

        {/* In-House & Non In-House */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-full rounded-full" />
          <Skeleton className="h-8 w-full rounded-full" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-linear-to-t from-primary/5 to-card">
              <TableRow className="border-b hover:bg-transparent">
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableHead
                    key={i}
                    className="h-12 whitespace-nowrap px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    <Skeleton className="h-3.5 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="h-16 hover:bg-transparent">
                  {Array.from({ length: 7 }).map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-3">
                      <Skeleton
                        className={`h-4 ${
                          colIndex === 0 ? "w-28" : colIndex === 1 ? "w-36" : "w-20"
                        }`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-36" />

        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32 rounded-full" />

          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const AppointmentTable = ({
  rows,
  query,
  dateRange,
  selectedClusters,
  onSelectedClustersChange,
}) => {
  const dateLabel = dateRange?.from
    ? dateRange.to && dateRange.to !== dateRange.from
      ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`
      : formatDate(dateRange.from)
    : null;

  const clusterLabel =
    selectedClusters?.length > 0 ? selectedClusters.join(", ") : "seluruh cluster";

  return (
    <div>
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={CalendarClockIcon} className="size-5" />
          Appointment Work Orders
          {/* {dateLabel && <>{dateLabel}</>} */}
        </CardTitle>
        <CardDescription>
          Semua work orders yang terjadwal di{" "}
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
            columns={AppointmentColumns}
            dateRange={dateRange}
            reportType="appointment"
            showInHouseFilter={true}
            showRoomStatusFilter={true}
            showCloseOutFilter={true}
            showWoStatusFilter={true}
            showEngineerFilter={true}
            showDicFilter={true}
            showWoManageByOwnerFilter={true}
            showPostChargeFilter={true}
            showBreakContractFilter={true}
            hideReportAndExport={true}
            selectedClusters={selectedClusters}
            onSelectedClustersChange={onSelectedClustersChange}
          />
        )}
      </CardContent>
    </div>
  );
};
