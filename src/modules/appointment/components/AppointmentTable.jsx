"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/modules/shared/work-orders";
import { TriangleAlertIcon } from "lucide-react";
import { AppointmentColumns } from "./AppointmentColumns";

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:w-[40%] lg:max-w-sm" />
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <Skeleton className="h-9 w-full lg:w-24" />
            <Skeleton className="h-9 w-full lg:w-28" />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <Skeleton className="h-9 w-full lg:w-28" />
            <Skeleton className="h-9 w-full lg:w-28" />
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

export const AppointmentTable = ({
  rows,
  query,
  dateRange,
  selectedClusters,
  onSelectedClustersChange,
}) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Appointment Work Orders</CardTitle>
        <CardDescription>Semua work orders yang dijadwalkan di seluruh cluster.</CardDescription>
      </CardHeader>
      <CardContent>
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
    </Card>
  );
};
