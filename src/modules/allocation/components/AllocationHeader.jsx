"use client";

import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
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
    <div className="flex flex-col items-start xl:flex-row xl:items-end xl:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-xl w-fit border bg-sidebar mb-3">
          <span className="size-1.5 rounded-full bg-green-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live Operation
          </p>
        </div>
        <Typography as="h2" className="font-extrabold text-2xl sm:text-3xl">
          Allocation Engineer
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Pilih cluster dan tanggal untuk menampilkan alokasian engineer.
        </Typography>
      </div>

      <div className="flex items-center gap-2 flex-wrap-reverse">
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
                className="text-sm gap-1 flex-1 lg:flex-none"
              >
                <HugeiconsIcon icon={MosqueLocationIcon} className="mr-0.5 size-4" />
                Cluster
                <Badge
                  variant={selectedClusters.length > 0 ? "secondary" : "default"}
                  className="w-6.5 text-xs ml-1"
                >
                  {selectedClusters.length || "All"}
                </Badge>
                <ChevronDownIcon className="size-3" />
              </Button>
            }
          />

          <DropdownMenuContent align="start" className="w-72 overflow-hidden p-0">
            {/* Header & Search */}
            <div className="sticky top-0 z-10 border-b p-2">
              <InputGroup className="h-7 w-full">
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
              <div className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
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
                      className="text-xs uppercase"
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

        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />

        <Button
          variant="default"
          onClick={() => {
            if (!query.isFetching) query.refetch();
          }}
          disabled={selectedClusters.length === 0}
        >
          <HugeiconsIcon
            icon={Refresh01Icon}
            className={`mr-0.5 size-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
};
