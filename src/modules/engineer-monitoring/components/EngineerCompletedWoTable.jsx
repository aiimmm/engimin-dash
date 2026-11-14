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
import { toTitleCase } from "@/lib/utils";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { WorkOrderTableFeatures } from "@/modules/shared/work-orders";
import { flexRender, useTable } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  SearchIcon,
  Settings2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EngineerCompletedWoColumns } from "./EngineerCompletedWoColumns";
import { ALL_DICS, DEFAULT_DICS } from "../lib";

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
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CoinsIcon className="size-5" />
              Daftar Detail WO Completed & CTO
            </CardTitle>
            <CardDescription className="mt-1">
              Data rincian WO status completed yang dikerjakan beserta nominal CTO per WO.
            </CardDescription>
          </div>
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
  );
};

export default EngineerCompletedWoTable;
