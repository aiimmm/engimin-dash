"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollButtons } from "@/components/ui/scroll-buttons";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api/client";
import { QUERY_STALE_MS, useAutoRefreshInterval } from "@/lib/config/refresh";
import { cn } from "@/lib/utils";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import {
  MosqueLocationIcon,
  UserRoundPlusIcon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { AllocationHeader } from "./AllocationHeader";
import { AllocationScheduleView } from "./AllocationScheduleView";
import { AllocationStats } from "./AllocationStats";
import { NonInHousePreviewReports } from "./NonInHousePreviewReports";

function LoadingAllocation() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton className="h-20 w-full rounded-xl" key={idx} />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-2xl lg:h-16" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

/** Trigger tab sederhana: ikon + judul + jumlah WO */
function AllocationTabTrigger({ value, title, icon, woCount, active }) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "flex! h-auto! w-full flex-none! items-center justify-center gap-2 rounded-2xl border-transparent px-3! py-2.5! whitespace-normal after:hidden",
        "transition-colors hover:bg-foreground/3",
        "data-active:bg-linear-to-t data-active:from-primary/5 data-active:to-card data-active:ring-1 data-active:ring-foreground/10",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")}
      />
      <span
        className={cn(
          "truncate text-xs font-semibold sm:text-sm",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {title}
      </span>
      {/* <span
        title="Total Work Order"
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-foreground/5 text-muted-foreground dark:bg-foreground/10",
        )}
      >
        {woCount}
      </span> */}
    </TabsTrigger>
  );
}

export const AllocationModules = () => {
  const defaultDate = useMemo(() => tomorrow(), []);
  const [dateRange, setDateRange] = useState({ from: defaultDate, to: defaultDate });
  const [activeTab, setActiveTab] = useState("internal");
  const [selectedClusters, setSelectedClusters] = useState([]);

  // Fetch cluster list from upstream API
  const clustersQuery = useQuery({
    queryKey: ["clusters-list"],
    queryFn: async () => {
      const res = await apiClient.get("/clusters");
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const clusters = useMemo(() => clustersQuery.data || [], [clustersQuery.data]);

  // Map cluster IDs to clusterNames for report header
  const selectedClusterLabels = useMemo(() => {
    const clusterMap = new Map(clusters.map((c) => [c.id, c.clusterName || c.clusterCode]));
    return selectedClusters.map((id) => clusterMap.get(id) || String(id));
  }, [clusters, selectedClusters]);

  // Query only fires when at least one cluster is selected
  const hasSelectedClusters = selectedClusters.length > 0;
  const autoRefreshInterval = useAutoRefreshInterval();

  const query = useQuery({
    queryKey: ["allocation-workorders", dateRange.from, dateRange.to, selectedClusters],
    queryFn: async () => {
      // If multiple clusters are selected, fetch concurrently per cluster and combine
      const results = await Promise.all(
        selectedClusters.map((clusterId) =>
          apiClient.get("/allocation", {
            params: {
              dateFrom: dateRange.from,
              dateTo: dateRange.to,
              cluster: clusterId,
              type: "allocation",
            },
          }),
        ),
      );

      // Merge and deduplicate by id / wo_no
      const seen = new Set();
      const combined = [];

      results.forEach((res) => {
        const rows = res.data?.data || [];
        rows.forEach((row) => {
          const key = row.id || row.wo_no || row.code;
          if (key && !seen.has(key)) {
            seen.add(key);
            combined.push(row);
          } else if (!key) {
            combined.push(row);
          }
        });
      });

      return {
        success: true,
        data: combined,
        count: combined.length,
      };
    },
    enabled: hasSelectedClusters,
    staleTime: QUERY_STALE_MS,
    refetchInterval: hasSelectedClusters ? autoRefreshInterval : false,
  });

  const allData = useMemo(() => query.data?.data || [], [query.data?.data]);

  // Tab Vendor: engineer_type === "vendor_engineer" (atau mengandung "vendor")
  // Tab Internal: sisanya
  const { internalData, vendorData } = useMemo(() => {
    const internal = [];
    const vendor = [];
    allData.forEach((item) => {
      const type = String(item.engineer_type || "")
        .trim()
        .toLowerCase();
      if (type === "vendor_engineer" || type.includes("vendor")) vendor.push(item);
      else internal.push(item);
    });
    return { internalData: internal, vendorData: vendor };
  }, [allData]);

  const tabs = [
    {
      value: "internal",
      title: "Engineer Internal",
      icon: UserSettings01Icon,
      data: internalData,
    },
    {
      value: "vendor",
      title: "Engineer Vendor",
      icon: UserRoundPlusIcon,
      data: vendorData,
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      <AllocationHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedClusters={selectedClusters}
        setSelectedClusters={setSelectedClusters}
        clusters={clusters}
        isLoadingClusters={clustersQuery.isLoading}
        query={query}
      />

      {/* When no cluster is selected yet */}
      {!hasSelectedClusters ? (
        <Card className="overflow-hidden transition-all bg-linear-to-t from-primary/5 to-card hover:shadow-md">
          <CardContent>
            <div className="grid min-h-64 place-items-center p-4 text-center sm:min-h-80 sm:p-8">
              <div className="max-w-md space-y-3">
                <div
                  className={cn(
                    "mx-auto flex size-12 shrink-0 items-center justify-center",
                    "rounded-xl border border-black/5 bg-neutral-200!",
                    "dark:border-white/5 dark:bg-neutral-800!",
                  )}
                >
                  <HugeiconsIcon icon={MosqueLocationIcon} className="size-6" />
                </div>
                <h3 className="text-base font-bold sm:text-lg">Pilih Cluster Terlebih Dahulu</h3>
                <p className="text-sm text-muted-foreground">
                  Data alokasi tidak dimuat otomatis saat awal masuk. Silakan pilih satu atau lebih
                  cluster pada dropdown <strong>Cluster</strong> di atas untuk memuat jadwal
                  alokasi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : query.isLoading ? (
        <LoadingAllocation />
      ) : query.isError ? (
        <Card className="overflow-hidden transition-all bg-linear-to-t from-primary/5 to-card hover:shadow-md">
          <CardContent>
            <div className="grid min-h-64 place-items-center p-4 text-center sm:min-h-80 sm:p-8">
              <div>
                <TriangleAlertIcon className="mx-auto size-10 text-destructive" />
                <p className="mt-4 font-semibold">Gagal memuat data alokasi work order</p>
                <p className="mt-1 text-sm text-muted-foreground">{query.error?.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
                  Coba Lagi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <AllocationStats rows={allData} />

          <Separator className="my-6" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
            <TabsList
              className={cn(
                "grid! h-auto! w-full! grid-cols-2 items-stretch gap-1 p-1 sm:gap-1.5 sm:p-1.5",
                "overflow-hidden rounded-2xl bg-card text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5 sm:rounded-[min(var(--radius-4xl),24px)] dark:ring-foreground/10",
              )}
            >
              {tabs.map((tab) => (
                <AllocationTabTrigger
                  key={tab.value}
                  value={tab.value}
                  title={tab.title}
                  icon={tab.icon}
                  woCount={tab.data.length}
                  active={activeTab === tab.value}
                />
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:space-y-6"
              >
                <AllocationScheduleView
                  data={tab.data}
                  tabName={tab.title}
                  date={dateRange.from}
                  selectedClusters={selectedClusterLabels}
                />
                <Separator className="my-4" />
                <NonInHousePreviewReports
                  data={tab.data}
                  tabName={tab.title}
                  dateRange={dateRange}
                  selectedClusters={selectedClusterLabels}
                />
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      <ScrollButtons bottom="bottom-6" right="right-6" />
    </div>
  );
};
