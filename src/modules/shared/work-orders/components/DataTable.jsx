"use client";

import { Typography } from "@/components/elements/Typography";
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
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { flexRender, useTable } from "@tanstack/react-table";
import {
  CalendarPlusIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { WorkOrderTableFeatures } from "./DataTableFeatures";
import { ExtendDialog } from "./ExtendDialog";
import { MoveDialog } from "./MoveDialog";

const pageSizes = [
  { label: "10 / Page", value: "10" },
  { label: "20 / Page", value: "20" },
  { label: "50 / Page", value: "50" },
  { label: "100 / Page", value: "100" },
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

export const WO_STATUS_OPTIONS = ["New", "On Progress", "Completed"];

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

export function DataTable({
  data = [],
  columns = [],
  dateRange,
  reportType,
  showInHouseFilter,
  showRoomStatusFilter,
  showCloseOutFilter,
  showWoStatusFilter,
  showEngineerFilter,
  showDicFilter,
  showWoManageByOwnerFilter,
  showPostChargeFilter,
  showBreakContractFilter,
  showMoveButton,
  hideReportAndExport,
  selectedClusters: externalClusters,
  onSelectedClustersChange,
  selectedDics: externalDics,
  onSelectedDicsChange,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalClusters, setInternalClusters] = useState([]);
  const selectedClusters = externalClusters !== undefined ? externalClusters : internalClusters;
  const setSelectedClusters = onSelectedClustersChange || setInternalClusters;

  const [internalDics, setInternalDics] = useState(ALL_DICS);
  const selectedDics = externalDics !== undefined ? externalDics : internalDics;
  const setSelectedDics = onSelectedDicsChange || setInternalDics;

  const [selectedWoStatuses, setSelectedWoStatuses] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [extendOpen, setExtendOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const clusters = useMemo(() => {
    const list = new Set();
    data.forEach((row) => {
      const c = row.cluster || row.cluster_name;
      if (c && c !== "—" && c !== "-") {
        list.add(String(c).trim());
      }
    });
    return Array.from(list).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      if (showDicFilter && selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(row.department || row.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      }
      if (showWoStatusFilter && selectedWoStatuses.length > 0) {
        if (!matchWoStatus(row.status || row.wo_status || row.woStatus, selectedWoStatuses))
          return false;
      }
      return true;
    });
  }, [data, selectedClusters, selectedDics, selectedWoStatuses, showDicFilter, showWoStatusFilter]);

  const table = useTable({
    features: WorkOrderTableFeatures,
    columns,
    data: filteredData,
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getRowId: (row, index) => row.id || row.woNumber || String(index),
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
    },
  });

  const pageCount = Math.max(1, table.getPageCount ? table.getPageCount() : 1);
  const pageIndex = pagination.pageIndex;
  const filteredRows = table.getRowModel().rows;

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().rows.map((r) => r.original);
  }, [table]);

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

  const toggleWoStatus = (status) => {
    setSelectedWoStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="w-full lg:w-[40%] lg:max-w-sm">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari WO, Unit, Engineer..."
            value={globalFilter ?? ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => setExtendOpen(true)}>
                <CalendarPlusIcon className="mr-1.5 size-4 text-emerald-600" />
                Extend ({selectedRows.length})
              </Button>
              {showMoveButton && (
                <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
                  Move ({selectedRows.length})
                </Button>
              )}
            </>
          )}

          {clusters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    Cluster ({selectedClusters.length || "All"})
                    <ChevronDownIcon className="ml-1 size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter Cluster</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {clusters.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c}
                      checked={selectedClusters.includes(c)}
                      onCheckedChange={() => toggleCluster(c)}
                    >
                      {c}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showDicFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    DIC ({selectedDics.length})
                    <ChevronDownIcon className="ml-1 size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter Department In Charge</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_DICS.map((dic) => (
                    <DropdownMenuCheckboxItem
                      key={dic}
                      checked={selectedDics.includes(dic)}
                      onCheckedChange={() => toggleDic(dic)}
                    >
                      {dic}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showWoStatusFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    WO Status ({selectedWoStatuses.length || "All"})
                    <ChevronDownIcon className="ml-1 size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter WO Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {WO_STATUS_OPTIONS.map((st) => (
                    <DropdownMenuCheckboxItem
                      key={st}
                      checked={selectedWoStatuses.includes(st)}
                      onCheckedChange={() => toggleWoStatus(st)}
                    >
                      {st}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Settings2Icon className="mr-1.5 size-4" />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(val) => col.toggleVisibility(!!val)}
                    >
                      {col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data work order.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between py-2 sm:flex-row gap-4 text-sm text-muted-foreground">
        <div>
          Showing {table.getRowModel().rows.length} of {filteredData.length} entries
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(val) =>
              setPagination((p) => ({ ...p, pageSize: Number(val), pageIndex: 0 }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizes.map((ps) => (
                  <SelectItem key={ps.value} value={ps.value}>
                    {ps.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Typography as="span" className="text-xs px-2">
              {pageIndex + 1} / {pageCount}
            </Typography>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <ExtendDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        targetRows={selectedRows}
        onSuccess={() => setRowSelection({})}
      />
      <MoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        targetRows={selectedRows}
        onSuccess={() => setRowSelection({})}
      />
    </div>
  );
}

export default DataTable;
