"use client";

import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { flexRender, useTable } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  Settings2Icon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { EngineerTotalTaskColumns } from "./EngineerTotalTaskColumns";

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full lg:w-[40%] lg:max-w-sm" />
        <Skeleton className="h-9 w-24" />
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

export const EngineerTotalTaskTable = ({ engineerTotals = [], query }) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "Engineer Name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useTable({
    features: WorkOrderTableFeatures,
    columns: EngineerTotalTaskColumns,
    data: engineerTotals,
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getRowId: (row, index) => row.fullname || String(index),
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
              <UsersIcon className="size-5 text-muted-foreground" />
              Total Task Engineer
            </CardTitle>
            <CardDescription className="mt-1">
              Ringkasan akumulasi task dan penyelesaian per engineer.
            </CardDescription>
          </div>
          {/* <Badge variant="outline" className="w-fit">
            Total {engineerTotals.length} Engineer
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
              <p className="mt-4 font-semibold">Gagal memuat data total task engineer</p>
              <p className="mt-1 text-sm text-muted-foreground">{query.error?.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <InputGroup className="w-full lg:w-[40%] lg:max-w-sm">
                <InputGroupInput
                  placeholder="Search engineer name, totals..."
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

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto justify-center whitespace-nowrap"
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
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
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
                          Tidak ada data total task engineer ditemukan.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
              <Typography as="p" className="text-xs text-muted-foreground">
                Menampilkan {start}–{end} dari {filteredCount} data
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

export default EngineerTotalTaskTable;
