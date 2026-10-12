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
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { WorkOrderTableFeatures } from "@/modules/shared/work-orders";
import { flexRender, useTable } from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  SearchIcon,
  Settings2Icon,
  TriangleAlertIcon,
  UserCheckIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EngineerCompletedWoColumns } from "./EngineerCompletedWoColumns";
import { ALL_DICS, DEFAULT_DICS } from "./EngineerTaskTable";

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:w-[40%] lg:max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
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

export const EngineerCompletedWoTable = ({
  completedTasks = [],
  query,
  selectedClusters: externalClusters,
  onSelectedClustersChange,
  selectedDics: externalDics,
  onSelectedDicsChange,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalClusters, setInternalClusters] = useState([]);
  const selectedClusters = externalClusters !== undefined ? externalClusters : internalClusters;
  const setSelectedClusters = onSelectedClustersChange || setInternalClusters;

  const [internalDics, setInternalDics] = useState(DEFAULT_DICS);
  const selectedDics = externalDics !== undefined ? externalDics : internalDics;
  const setSelectedDics = onSelectedDicsChange || setInternalDics;

  const [sorting, setSorting] = useState([{ id: "Engineer", desc: false }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedEngineer, setSelectedEngineer] = useState("ALL");

  // Extract unique clusters strictly from cluster / cluster_name
  const clusters = useMemo(() => {
    const set = new Set();
    completedTasks.forEach((t) => {
      const c = String(t.cluster || "").trim();
      if (c && c !== "—" && c !== "-") set.add(c);
    });
    return Array.from(set).sort();
  }, [completedTasks]);

  // Extract unique engineers (excluding Unassigned)
  const engineerOptions = useMemo(() => {
    const set = new Set();
    completedTasks.forEach((t) => {
      const eng = String(t.engineer || "").trim();
      if (eng && eng !== "—" && eng !== "-" && eng.toLowerCase() !== "unassigned") {
        set.add(eng);
      }
    });
    return Array.from(set).sort();
  }, [completedTasks]);

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

  // Filter completed tasks by cluster, dic, and engineer (excluding Unassigned)
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((t) => {
      // Exclude Unassigned
      const eng = String(t.engineer || "")
        .trim()
        .toLowerCase();
      if (!eng || eng === "unassigned" || eng === "—" || eng === "-") return false;

      // Cluster
      if (selectedClusters.length > 0) {
        const c = String(t.cluster || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      // DIC
      if (selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(t.department || t.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      } else {
        return false;
      }
      // Engineer select filter
      if (selectedEngineer !== "ALL") {
        const rowEng = String(t.engineer || "").trim();
        if (rowEng !== selectedEngineer) return false;
      }
      return true;
    });
  }, [completedTasks, selectedClusters, selectedDics, selectedEngineer]);

  // Engineer summary stats calculation (Total completed WO & Total CTO per engineer)
  const engineerSummaries = useMemo(() => {
    const map = new Map();

    filteredCompletedTasks.forEach((t) => {
      const name = String(t.engineer || "").trim();
      if (!name || name.toLowerCase() === "unassigned" || name === "—" || name === "-") return;
      if (!map.has(name)) {
        map.set(name, {
          name,
          totalCompletedWo: 0,
          totalCtoPrice: 0,
          units: new Set(),
        });
      }
      const item = map.get(name);
      item.totalCompletedWo += 1;
      item.totalCtoPrice += Number(t.ctoPrice || 0);
      const unitKey = t.unit || t.roomCode || t.id;
      if (unitKey && unitKey !== "—") item.units.add(unitKey);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredCompletedTasks]);

  // Overall totals
  const totalCompletedCount = filteredCompletedTasks.length;
  const grandTotalCto = useMemo(() => {
    return filteredCompletedTasks.reduce((acc, t) => acc + Number(t.ctoPrice || 0), 0);
  }, [filteredCompletedTasks]);

  const table = useTable({
    features: WorkOrderTableFeatures,
    columns: EngineerCompletedWoColumns,
    data: filteredCompletedTasks,
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getRowId: (row, index) => row.id || String(index),
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
    <div className="space-y-6">
      {/* Summary Cards Per Engineer */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2Icon className="size-5 " />
                Rekap WO Completed & CTO Engineer
              </CardTitle>
              <CardDescription className="mt-1">
                Total penyelesaian WO dan akumulasi CTO yang didapatkan per engineer.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-2 rounded-md border bg-clip-padding border-border aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30">
                {totalCompletedCount} WO Completed
              </div>
              <div className="px-3 py-2 rounded-md border bg-clip-padding border-border aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30">
                Total CTO: {formatCurrency(grandTotalCto)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton className="h-24 w-full rounded-xl" key={idx} />
              ))}
            </div>
          ) : engineerSummaries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada data WO completed pada filter / periode tanggal ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {engineerSummaries.map((eng) => (
                <div
                  key={eng.name}
                  onClick={() => {
                    setSelectedEngineer((prev) => (prev === eng.name ? "ALL" : eng.name));
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    selectedEngineer === eng.name
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserCheckIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-semibold text-xs truncate">
                        {toTitleCase(eng.name)}
                      </span>
                    </div>
                    <Badge className="text-[10px] shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {eng.totalCompletedWo} WO
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-dashed">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CoinsIcon className="size-4" />
                      CTO:
                    </span>
                    <span className="font-mono font-semibold text-xs text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(eng.totalCtoPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Completed WO Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CoinsIcon className="size-5 " />
                Daftar Detail WO Completed & CTO
              </CardTitle>
              <CardDescription className="mt-1">
                Data rincian WO status completed yang dikerjakan beserta nominal CTO per WO.
              </CardDescription>
            </div>
            {/* <div className="flex items-center gap-2">
              {selectedEngineer !== "ALL" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEngineer("ALL")}
                  className="w-fit text-xs"
                >
                  Filter: {toTitleCase(selectedEngineer)} (Reset)
                </Button>
              )}
              <Badge variant="outline" className="w-fit">
                Total {filteredCompletedTasks.length} WO
              </Badge>
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <LoadingTable />
          ) : query.isError ? (
            <div className="grid min-h-60 place-items-center p-8 text-center">
              <div>
                <TriangleAlertIcon className="mx-auto size-10 text-destructive" />
                <p className="mt-4 font-semibold">Gagal memuat data WO completed</p>
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
                  {/* Engineer Filter Dropdown */}
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
                      Engineer
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
                              {toTitleCase(eng)}
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
                            {header.isPlaceholder ? null : (
                              <div className="flex items-center">
                                {typeof header.column.columnDef.header === "function"
                                  ? header.column.columnDef.header(header.getContext())
                                  : header.column.columnDef.header}
                              </div>
                            )}
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
                              {typeof cell.column.columnDef.cell === "function"
                                ? cell.column.columnDef.cell(cell.getContext())
                                : cell.getValue()}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={EngineerCompletedWoColumns.length}
                          className="h-24 text-center"
                        >
                          <Typography as="p" className="text-muted-foreground">
                            Tidak ada data WO completed ditemukan.
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
                  Menampilkan {start}–{end} dari {filteredCount} work order yang telah completed.
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EngineerCompletedWoTable;
