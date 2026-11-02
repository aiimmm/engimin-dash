"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkOrderTableFeatures } from "@/modules/shared/work-orders";
import { flexRender, useTable } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AllocationColumns } from "./AllocationColumns";

const pageSizes = [
  { label: "10 / Page", value: "10" },
  { label: "20 / Page", value: "20" },
  { label: "50 / Page", value: "50" },
];

export const AllocationTable = ({
  data = [],
  query,
  selectedClusters: controlledSelectedClusters,
  onSelectedClustersChange,
  selectedEngineer: controlledSelectedEngineer,
  onSelectedEngineerChange,
  emptyMessage = "Tidak ada data alokasi ditemukan.",
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalSelectedClusters, setInternalSelectedClusters] = useState([]);
  const selectedClusters =
    controlledSelectedClusters !== undefined
      ? controlledSelectedClusters
      : internalSelectedClusters;
  const setSelectedClusters = onSelectedClustersChange || setInternalSelectedClusters;

  const [internalSelectedEngineer, setInternalSelectedEngineer] = useState("ALL");
  const selectedEngineer =
    controlledSelectedEngineer !== undefined
      ? controlledSelectedEngineer
      : internalSelectedEngineer;
  const setSelectedEngineer = onSelectedEngineerChange || setInternalSelectedEngineer;

  const [inHouseFilter, setInHouseFilter] = useState("all");
  const [guestApptFilter, setGuestApptFilter] = useState("all");
  const [sorting, setSorting] = useState([{ id: "Engineer Name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Extract unique clusters strictly from cluster / cluster_name / clusterName
  const clusters = useMemo(() => {
    const set = new Set();
    data.forEach((row) => {
      const cluster = String(row.cluster || row.cluster_name || row.clusterName || "").trim();
      if (cluster && cluster !== "—" && cluster !== "-") {
        set.add(cluster);
      }
    });
    return Array.from(set).sort();
  }, [data]);

  function toggleCluster(cluster) {
    setSelectedClusters((current) =>
      current.includes(cluster)
        ? current.filter((item) => item !== cluster)
        : [...current, cluster],
    );
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  // Extract unique engineers
  const engineerOptions = useMemo(() => {
    const set = new Set();
    data.forEach((row) => {
      const eng = String(row.engineer_1 || row.engineer || "").trim();
      if (eng && eng !== "—" && eng !== "-" && eng.toLowerCase() !== "unassigned") {
        set.add(eng.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Cluster filter
      if (selectedClusters.length > 0) {
        const cluster = String(row.cluster || row.cluster_name || row.clusterName || "").trim();
        if (!selectedClusters.includes(cluster)) return false;
      }

      // Engineer filter
      if (selectedEngineer !== "ALL") {
        const eng = String(row.engineer_1 || row.engineer || "")
          .trim()
          .toUpperCase();
        if (eng !== selectedEngineer) return false;
      }

      // In-House filter
      if (inHouseFilter !== "all") {
        const status = String(row.roomStatusName || row.roomStatus || "").toLowerCase();
        const isInHouse = status.includes("occupied");
        if (inHouseFilter === "inHouse" && !isInHouse) return false;
        if (inHouseFilter === "nonInHouse" && isInHouse) return false;
      }

      // Guest appointment filter
      if (guestApptFilter !== "all") {
        const isAppt =
          String(row.is_guestAppointment || "").toLowerCase() === "yes" ||
          row.is_guestAppointment === 1 ||
          row.is_guestAppointment === true;
        if (guestApptFilter === "yes" && !isAppt) return false;
        if (guestApptFilter === "no" && isAppt) return false;
      }

      return true;
    });
  }, [data, selectedClusters, selectedEngineer, inHouseFilter, guestApptFilter]);

  const table = useTable({
    features: WorkOrderTableFeatures,
    columns: AllocationColumns,
    data: filteredData,
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getRowId: (row, idx) => row.id || row.wo_no || String(idx),
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredCount = filteredRows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const start = filteredCount ? pageIndex * pagination.pageSize + 1 : 0;
  const end = Math.min((pageIndex + 1) * pagination.pageSize, filteredCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="w-full lg:w-[35%] lg:max-w-xs">
          <InputGroupInput
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Cluster Dropdown Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center whitespace-nowrap text-xs sm:text-sm"
                />
              }
            >
              Cluster
              {selectedClusters.length > 0 && (
                <Badge
                  variant="default"
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                >
                  {selectedClusters.length}
                </Badge>
              )}
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-lg max-h-80 min-w-64 overflow-y-auto"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Pilih Cluster:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {clusters.length ? (
                  clusters.map((cluster) => (
                    <DropdownMenuCheckboxItem
                      key={cluster}
                      checked={selectedClusters.includes(cluster)}
                      onCheckedChange={() => toggleCluster(cluster)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {cluster}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    Tidak ada cluster tersedia
                  </p>
                )}
              </DropdownMenuGroup>
              {selectedClusters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setSelectedClusters([]);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    Tampilkan Semua Cluster
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Engineer Dropdown Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center whitespace-nowrap text-xs sm:text-sm"
                />
              }
            >
              Engineer: {selectedEngineer === "ALL" ? "All" : selectedEngineer}
              {selectedEngineer !== "ALL" && (
                <Badge
                  variant="default"
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                >
                  1
                </Badge>
              )}
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-lg max-h-80 min-w-56 overflow-y-auto"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Engineer:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedEngineer === "ALL"}
                  onCheckedChange={() => {
                    setSelectedEngineer("ALL");
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  Semua Engineer
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {engineerOptions.length ? (
                  engineerOptions.map((eng) => (
                    <DropdownMenuCheckboxItem
                      key={eng}
                      checked={selectedEngineer === eng}
                      onCheckedChange={(checked) => {
                        setSelectedEngineer(checked ? eng : "ALL");
                        setPagination((p) => ({ ...p, pageIndex: 0 }));
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {eng}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    Tidak ada engineer tersedia
                  </p>
                )}
              </DropdownMenuGroup>
              {selectedEngineer !== "ALL" && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setSelectedEngineer("ALL");
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    Reset Engineer
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* In-House Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center whitespace-nowrap text-xs sm:text-sm"
                />
              }
            >
              In-House:{" "}
              {inHouseFilter === "all"
                ? "All"
                : inHouseFilter === "inHouse"
                  ? "In-House"
                  : "Non In-House"}
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter In-House Status:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { label: "All", value: "all" },
                  { label: "In-House", value: "inHouse" },
                  { label: "Non In-House", value: "nonInHouse" },
                ].map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    checked={inHouseFilter === item.value}
                    onCheckedChange={() => {
                      setInHouseFilter(item.value);
                      setPagination((c) => ({ ...c, pageIndex: 0 }));
                    }}
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Guest Appointment Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center whitespace-nowrap text-xs sm:text-sm"
                />
              }
            >
              Appointment:{" "}
              {guestApptFilter === "all" ? "All" : guestApptFilter === "yes" ? "Yes" : "No"}
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter Guest Appointment:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { label: "All", value: "all" },
                  { label: "Appointment (Yes)", value: "yes" },
                  { label: "No Appointment", value: "no" },
                ].map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    checked={guestApptFilter === item.value}
                    onCheckedChange={() => {
                      setGuestApptFilter(item.value);
                      setPagination((c) => ({ ...c, pageIndex: 0 }));
                    }}
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Toggle Button */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto justify-center whitespace-nowrap text-xs sm:text-sm"
                />
              }
            >
              <Settings2Icon /> Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg min-w-40" align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.columnDef?.meta?.label || column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="h-12 font-semibold" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={AllocationColumns.length} className="h-24 text-center">
                  <Typography as="p" className="text-muted-foreground">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 py-2 sm:flex-row">
        <Typography as="span" className="text-xs text-muted-foreground">
          Menampilkan data {start}–{end} dari total {filteredCount} data.
        </Typography>

        <div className="flex items-center gap-2">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(val) => {
              table.setPageSize(Number(val));
            }}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value} className="text-xs">
                    {size.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="px-2 text-xs font-medium">
              {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
