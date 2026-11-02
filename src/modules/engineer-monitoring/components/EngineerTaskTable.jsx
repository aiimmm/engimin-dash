"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkOrderTableFeatures } from "@/modules/shared/work-orders";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { useTable } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  Settings2Icon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EngineerTaskColumns } from "./EngineerTaskColumns";

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:w-[40%] lg:max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Skeleton className="h-12 w-full" key={idx} />
      ))}
      <div className="flex flex-col items-center justify-between py-4 sm:flex-row gap-4">
        <Skeleton className="h-4 sm:w-1/5 w-1/8" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

const pageSizes = [
  { label: "10 / Page", value: "10" },
  { label: "20 / Page", value: "20" },
  { label: "50 / Page", value: "50" },
];

export const ALL_DICS = [
  "Engineering",
  "Operational",
  "Unassigned / null",
  "Traveliomart",
  "CS",
  "Technical Auditor",
  "ORM",
  "Admin Inventory",
];

export const DEFAULT_DICS = ["Engineering", "Operational", "Unassigned / null", "Traveliomart"];

export const ENGINEER_STATUS_OPTIONS = ["Arrived", "Assign", "Pending", "Rejected", "Completed"];

export const WO_STATUS_OPTIONS = ["New", "On Progress", "Completed"];

export function matchEngineerStatus(rowStatus, selectedStatuses) {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  const status = String(rowStatus || "")
    .toLowerCase()
    .trim();
  return selectedStatuses.some((sel) => {
    const s = sel.toLowerCase();
    if (s === "arrived") return status.includes("arriv");
    if (s === "assign") return status.includes("assign") && !status.includes("unassign");
    if (s === "pending") return status.includes("pending");
    if (s === "rejected") return status.includes("reject");
    if (s === "completed") return status.includes("complete");
    return status.includes(s);
  });
}

export function matchWoStatus(rowStatus, selectedStatuses) {
  if (!selectedStatuses || selectedStatuses.length === 0) return true;
  const status = String(rowStatus || "")
    .toLowerCase()
    .trim();
  return selectedStatuses.some((sel) => {
    const s = sel.toLowerCase();
    if (s === "new") return status === "new" || status === "1";
    if (s === "on progress")
      return status.includes("progress") || status === "active" || status === "2";
    if (s === "completed") return status.includes("complete") || status === "3" || status === "5";
    return status.includes(s);
  });
}

export const EngineerTaskTable = ({
  tasks = [],
  query,
  selectedClusters: externalClusters,
  onSelectedClustersChange,
  selectedDics: externalDics,
  onSelectedDicsChange,
  selectedEngStatuses: externalEngStatuses,
  onSelectedEngStatusesChange,
  selectedWoStatuses: externalWoStatuses,
  onSelectedWoStatusesChange,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalClusters, setInternalClusters] = useState([]);
  const selectedClusters = externalClusters !== undefined ? externalClusters : internalClusters;
  const setSelectedClusters = onSelectedClustersChange || setInternalClusters;

  const [internalDics, setInternalDics] = useState(ALL_DICS);
  const selectedDics = externalDics !== undefined ? externalDics : internalDics;
  const setSelectedDics = onSelectedDicsChange || setInternalDics;

  const [internalEngStatuses, setInternalEngStatuses] = useState([]);
  const selectedEngStatuses =
    externalEngStatuses !== undefined ? externalEngStatuses : internalEngStatuses;
  const setSelectedEngStatuses = onSelectedEngStatusesChange || setInternalEngStatuses;

  const [internalWoStatuses, setInternalWoStatuses] = useState([]);
  const selectedWoStatuses =
    externalWoStatuses !== undefined ? externalWoStatuses : internalWoStatuses;
  const setSelectedWoStatuses = onSelectedWoStatusesChange || setInternalWoStatuses;

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    "GenID — Tower — Room": false,
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Extract cluster list strictly from cluster / cluster_name
  const clusters = useMemo(() => {
    const list = new Set();
    tasks.forEach((row) => {
      const c = row.cluster || row.cluster_name;
      if (c && c !== "—" && c !== "-") {
        list.add(String(c).trim());
      }
    });
    return Array.from(list).sort();
  }, [tasks]);

  const filteredData = useMemo(() => {
    return tasks.filter((row) => {
      // Cluster filter
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      // DIC filter
      if (selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(row.department || row.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      } else {
        return false;
      }
      // Engineer status filter
      if (selectedEngStatuses.length > 0) {
        if (!matchEngineerStatus(row.engineer_status, selectedEngStatuses)) return false;
      }
      // WO status filter
      if (selectedWoStatuses.length > 0) {
        if (!matchWoStatus(row.status || row.wo_status, selectedWoStatuses)) return false;
      }
      return true;
    });
  }, [tasks, selectedClusters, selectedDics, selectedEngStatuses, selectedWoStatuses]);

  const table = useTable({
    features: WorkOrderTableFeatures,
    columns: EngineerTaskColumns,
    data: filteredData,
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getRowId: (row, index) => row.id || row.number || String(index),
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  const toggleCluster = (cluster) => {
    setSelectedClusters((prev) =>
      prev.includes(cluster) ? prev.filter((c) => c !== cluster) : [...prev, cluster],
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const toggleDic = (dic) => {
    setSelectedDics((prev) =>
      prev.includes(dic) ? prev.filter((d) => d !== dic) : [...prev, dic],
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const toggleEngStatus = (status) => {
    setSelectedEngStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const toggleWoStatus = (status) => {
    setSelectedWoStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const selectAllDics = () => {
    if (selectedDics.length === ALL_DICS.length) {
      setSelectedDics([]);
    } else {
      setSelectedDics([...ALL_DICS]);
    }
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const resetToDefaultDics = () => {
    setSelectedDics([...DEFAULT_DICS]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const filteredRows = table.getFilteredRowModel().rows;
  const filteredCount = filteredRows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = Math.min(pagination.pageIndex, pageCount - 1);
  const start = filteredCount ? pageIndex * pagination.pageSize + 1 : 0;
  const end = Math.min((pageIndex + 1) * pagination.pageSize, filteredCount);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WrenchIcon className="size-5 text-muted-foreground" />
              Task Engineer
            </CardTitle>
            <CardDescription className="mt-1">
              Daftar pekerjaan engineer aktif dan rincian penugasan unit.
            </CardDescription>
          </div>
          {/* <Badge variant="outline" className="w-fit">
            Total {filteredData.length} Task
          </Badge> */}
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <LoadingTable />
        ) : query.isError ? (
          <div className="grid min-h-60 place-items-center p-8 text-center">
            <div>
              <TriangleAlertIcon className="mx-auto size-10 text-destructive" />
              <p className="mt-4 font-semibold">Gagal memuat data task engineer</p>
              <p className="mt-1 text-sm text-muted-foreground">{query.error?.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <InputGroup className="w-full lg:w-[30%] lg:max-w-xs">
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
                {/* Cluster Filter */}
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
                      <DropdownMenuLabel>Select the displayed cluster:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {clusters.length ? (
                        clusters.map((cluster) => (
                          <DropdownMenuCheckboxItem
                            key={cluster}
                            checked={selectedClusters.includes(cluster)}
                            onCheckedChange={() => toggleCluster(cluster)}
                            onSelect={(event) => event.preventDefault()}
                          >
                            {cluster}
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <p className="px-2 py-3 text-xs text-muted-foreground">
                          No clusters available
                        </p>
                      )}
                    </DropdownMenuGroup>
                    {selectedClusters.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => setSelectedClusters([])}
                        >
                          Show all clusters
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* DIC Filter */}
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
                    DIC
                    {selectedDics.length > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                      >
                        {selectedDics.length === ALL_DICS.length ? "All" : selectedDics.length}
                      </Badge>
                    )}
                    <ChevronDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-lg max-h-80 min-w-56 overflow-y-auto"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Select Department:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={selectedDics.length === ALL_DICS.length}
                        onCheckedChange={selectAllDics}
                        onSelect={(e) => e.preventDefault()}
                      >
                        All DIC
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {ALL_DICS.map((dic) => (
                        <DropdownMenuCheckboxItem
                          key={dic}
                          checked={selectedDics.includes(dic)}
                          onCheckedChange={() => toggleDic(dic)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {dic}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={resetToDefaultDics}
                    >
                      Reset to Default
                    </Button>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Engineer Status Filter */}
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
                    Eng Status
                    {selectedEngStatuses.length > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                      >
                        {selectedEngStatuses.length === ENGINEER_STATUS_OPTIONS.length
                          ? "All"
                          : selectedEngStatuses.length}
                      </Badge>
                    )}
                    <ChevronDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-lg max-h-80 min-w-52 overflow-y-auto"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Filter Engineer Status:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={selectedEngStatuses.length === 0}
                        onCheckedChange={() => setSelectedEngStatuses([])}
                        onSelect={(e) => e.preventDefault()}
                      >
                        All Statuses
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {ENGINEER_STATUS_OPTIONS.map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={selectedEngStatuses.includes(status)}
                          onCheckedChange={() => toggleEngStatus(status)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                    {selectedEngStatuses.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setSelectedEngStatuses([])}
                        >
                          Reset
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* WO Status Filter */}
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
                    WO Status
                    {selectedWoStatuses.length > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
                      >
                        {selectedWoStatuses.length === WO_STATUS_OPTIONS.length
                          ? "All"
                          : selectedWoStatuses.length}
                      </Badge>
                    )}
                    <ChevronDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-lg max-h-80 min-w-48 overflow-y-auto"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Filter WO Status:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={selectedWoStatuses.length === 0}
                        onCheckedChange={() => setSelectedWoStatuses([])}
                        onSelect={(e) => e.preventDefault()}
                      >
                        All Statuses
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {WO_STATUS_OPTIONS.map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={selectedWoStatuses.includes(status)}
                          onCheckedChange={() => toggleWoStatus(status)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuGroup>
                    {selectedWoStatuses.length > 0 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setSelectedWoStatuses([])}
                        >
                          Reset
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Columns Toggle */}
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

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead className="h-12 font-semibold" key={header.id}>
                          {header.isPlaceholder ? null : <table.FlexRender header={header} />}
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
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="h-24 text-center"
                      >
                        <Typography as="p" className="text-muted-foreground">
                          Tidak ada data task engineer ditemukan.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
              <Typography as="p" className="text-xs text-muted-foreground">
                Menampilkan {start}–{end} dari {filteredCount} data.
              </Typography>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination({ pageIndex: 0, pageSize: Number(value) })
                  }
                >
                  <SelectTrigger className="h-8 rounded-xl bg-input/50 px-3 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {pageSizes.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon-lg"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeftIcon />
                </Button>
                <Typography as="span" className="min-w-20 text-center text-xs">
                  {pageIndex + 1} / {pageCount}
                </Typography>
                <Button
                  variant="outline"
                  size="icon-lg"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EngineerTaskTable;
