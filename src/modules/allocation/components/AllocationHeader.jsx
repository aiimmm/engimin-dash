"use client";

import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { LiveOperationBadge } from "@/components/elements/LiveOperationBadge";
import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { MosqueLocationIcon, Refresh01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

export const AllocationHeader = ({
  dateRange,
  setDateRange,
  selectedClusters = [],
  setSelectedClusters,
  clusters = [],
  isLoadingClusters = false,
  query,
}) => {
  const [clusterSearch, setClusterSearch] = useState("");

  const filteredClusterOptions = useMemo(() => {
    const q = clusterSearch.trim().toLowerCase();
    if (!q) return clusters;
    return clusters.filter(
      (c) =>
        String(c.id).toLowerCase().includes(q) ||
        String(c.clusterName || "")
          .toLowerCase()
          .includes(q) ||
        String(c.clusterCode || "")
          .toLowerCase()
          .includes(q),
    );
  }, [clusters, clusterSearch]);

  const toggleCluster = (id) => {
    setSelectedClusters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const clearClusters = () => {
    setSelectedClusters([]);
  };

  return (
    // Mobile & tablet: judul di atas, toolbar di bawah (full width).
    // Desktop (xl): judul kiri, toolbar kanan dalam satu baris.
    <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <LiveOperationBadge />
        <Typography as="h2" className="text-xl font-extrabold sm:text-2xl lg:text-3xl">
          Allocation Engineer
        </Typography>
        <Typography as="p" className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Pilih cluster dan tanggal untuk menampilkan alokasian engineer.
        </Typography>
      </div>

      {/* Mobile & tablet (di bawah lg): 2 baris (1: date + refresh icon, 2: cluster). lg ke atas: 1 baris. */}
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center xl:w-auto">
        {/* Cluster Selector Dropdown from API */}
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) setClusterSearch("");
          }}
        >
          <DropdownMenuTrigger
            render={
              <Button
                variant={selectedClusters.length > 0 ? "default" : "secondary"}
                className="w-full justify-center gap-1 text-sm max-lg:order-2 lg:w-auto"
              >
                <HugeiconsIcon icon={MosqueLocationIcon} className="mr-0.5 size-4" />
                Cluster
                <Badge
                  variant={selectedClusters.length > 0 ? "secondary" : "default"}
                  className="ml-1 w-6.5 text-xs"
                >
                  {selectedClusters.length || "All"}
                </Badge>
                <ChevronDownIcon className="size-3" />
              </Button>
            }
          />

          {/* Lebar dibatasi viewport supaya tidak keluar layar di mobile */}
          <DropdownMenuContent
            align="start"
            className="w-[min(18rem,calc(100vw-2rem))] overflow-hidden p-0"
          >
            {/* Header & Search */}
            <div className="sticky top-0 z-10 border-b p-2">
              <InputGroup className="h-8 w-full sm:h-7">
                <InputGroupAddon>
                  <HugeiconsIcon icon={Search01Icon} className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari cluster..."
                  className="text-xs"
                  value={clusterSearch}
                  onChange={(e) => setClusterSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </InputGroup>
            </div>

            {/* Cluster List */}
            <DropdownMenuGroup>
              <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-1.5 sm:max-h-60">
                {isLoadingClusters ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-7 w-full rounded-md" />
                    <Skeleton className="h-7 w-full rounded-md" />
                    <Skeleton className="h-7 w-full rounded-md" />
                  </div>
                ) : filteredClusterOptions.length > 0 ? (
                  filteredClusterOptions.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.id}
                      checked={selectedClusters.includes(c.id)}
                      onCheckedChange={() => toggleCluster(c.id)}
                      onSelect={(e) => e.preventDefault()}
                      className="py-2 text-xs uppercase sm:py-1.5"
                    >
                      <span className="min-w-0 truncate">{c.clusterName || `Cluster ${c.id}`}</span>
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="mx-auto mb-2 size-5 text-muted-foreground/50"
                    />

                    <p className="text-xs text-muted-foreground">Tidak ada cluster ditemukan</p>
                  </div>
                )}
              </div>
            </DropdownMenuGroup>
            {/* Footer */}
            {selectedClusters.length > 0 && (
              <>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-1 pb-1.5">
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={clearClusters}
                    className="w-full text-xs"
                  >
                    Reset filter
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Baris 1 di mobile/tablet; di lg wrapper "menghilang" (contents) sehingga satu baris dengan cluster */}
        <div className="flex items-center gap-2 max-lg:order-1 lg:contents">
          <div className="min-w-0 flex-1 lg:flex-none *:w-full lg:*:w-auto">
            <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
          </div>

          <Button
            variant="default"
            aria-label="Refresh"
            className="shrink-0 max-sm:aspect-square max-sm:px-0"
            onClick={() => {
              if (!query.isFetching) query.refetch();
            }}
            disabled={selectedClusters.length === 0}
          >
            <HugeiconsIcon
              icon={Refresh01Icon}
              className={`size-4 sm:mr-0.5 ${query.isFetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
