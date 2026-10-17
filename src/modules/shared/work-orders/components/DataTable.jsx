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
import { checkIsInHouse, getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import {
  CalendarDate1Icon,
  ClockPlusIcon,
  Columns3CogIcon,
  DepartementIcon,
  MosqueLocationIcon,
  Refresh03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { flexRender, useTable } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
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

  // Filter WO Status (single-select, konsisten dengan filter chip lain)
  const [filterWoStatus, setFilterWoStatus] = useState("all"); // "all"|"new"|"onprogress"|"completed"

  // Filter-filter tambahan (null = all, "yes"/"no" untuk boolean, string untuk value)
  const [filterInHouse, setFilterInHouse] = useState("all"); // "all" | "inhouse" | "noninhouse"
  const [filterEngineer, setFilterEngineer] = useState("all"); // "all" | "assigned" | "unassigned"
  const [filterRoomStatus, setFilterRoomStatus] = useState("all"); // "all" | "minor" | "major" | "nostatus"
  const [filterCloseOut, setFilterCloseOut] = useState("all"); // "all" | "open" | "closeout"
  const [filterWoByOwner, setFilterWoByOwner] = useState("all"); // "all" | "yes" | "no"
  const [filterPostCharge, setFilterPostCharge] = useState("all"); // "all" | "yes" | "no"
  const [filterBreakContract, setFilterBreakContract] = useState("all"); // "all" | "yes" | "no"

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
      // --- Cluster filter ---
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }

      // --- Department In Charge filter ---
      if (showDicFilter && selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(row.department || row.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      }

      // --- WO Status filter ---
      if (showWoStatusFilter && filterWoStatus !== "all") {
        if (
          !matchWoStatus(row.status || row.wo_status || row.woStatus, [
            filterWoStatus === "onprogress" ? "on progress" : filterWoStatus,
          ])
        )
          return false;
      }

      // --- In House filter (pakai checkIsInHouse: ada tamu = in-house) ---
      if (showInHouseFilter && filterInHouse !== "all") {
        const isInHouse = checkIsInHouse(row);
        if (filterInHouse === "inhouse" && !isInHouse) return false;
        if (filterInHouse === "noninhouse" && isInHouse) return false;
      }

      // --- Engineer filter ---
      if (showEngineerFilter && filterEngineer !== "all") {
        const eng = String(row.engineer ?? "")
          .toLowerCase()
          .trim();
        const isUnassigned = !eng || eng.includes("unassigned");
        if (filterEngineer === "assigned" && isUnassigned) return false;
        if (filterEngineer === "unassigned" && !isUnassigned) return false;
      }

      // --- Room Status filter ---
      if (showRoomStatusFilter && filterRoomStatus !== "all") {
        const rs = String(row.roomStatus ?? row.room_status ?? "")
          .toLowerCase()
          .trim();
        if (filterRoomStatus === "minor" && rs !== "minor") return false;
        if (filterRoomStatus === "major" && rs !== "major") return false;
        if (filterRoomStatus === "nostatus" && rs !== "" && rs !== "-" && rs !== "—") return false;
      }

      // --- Close Out filter ---
      if (showCloseOutFilter && filterCloseOut !== "all") {
        const isCO = Number(row.isIncludeCloseOut ?? row.is_include_close_out ?? 0) === 1;
        if (filterCloseOut === "closeout" && !isCO) return false;
        if (filterCloseOut === "open" && isCO) return false;
      }

      // --- WO By Owner filter ---
      if (showWoManageByOwnerFilter && filterWoByOwner !== "all") {
        const isOwner =
          Number(
            row.isWoManageByOwner ?? row.is_wo_manage_by_owner ?? row.wo_manage_by_owner ?? 0,
          ) === 1;
        if (filterWoByOwner === "yes" && !isOwner) return false;
        if (filterWoByOwner === "no" && isOwner) return false;
      }

      // --- Post Charge filter ---
      if (showPostChargeFilter && filterPostCharge !== "all") {
        const hasPC =
          Number(row.postChargeListLength ?? row.post_charge_list_length ?? 0) > 0 ||
          (Array.isArray(row.postChargeList) && row.postChargeList.length > 0) ||
          (Array.isArray(row.post_charge_list) && row.post_charge_list.length > 0);
        if (filterPostCharge === "yes" && !hasPC) return false;
        if (filterPostCharge === "no" && hasPC) return false;
      }

      // --- Break Contract filter ---
      if (showBreakContractFilter && filterBreakContract !== "all") {
        const isBreak = Boolean(row.isBreakContract ?? row.is_break_contract);
        if (filterBreakContract === "yes" && !isBreak) return false;
        if (filterBreakContract === "no" && isBreak) return false;
      }

      return true;
    });
  }, [
    data,
    selectedClusters,
    selectedDics,
    filterWoStatus,
    showDicFilter,
    showWoStatusFilter,
    showInHouseFilter,
    showEngineerFilter,
    showRoomStatusFilter,
    showCloseOutFilter,
    showWoManageByOwnerFilter,
    showPostChargeFilter,
    showBreakContractFilter,
    filterInHouse,
    filterEngineer,
    filterRoomStatus,
    filterCloseOut,
    filterWoByOwner,
    filterPostCharge,
    filterBreakContract,
  ]);

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

  // Count In-House / Non In-House dari data yang sudah difilter cluster (+ filter lain)
  // tapi TIDAK dipengaruhi filterInHouse itu sendiri, supaya badge selalu menunjukkan total per cluster
  const inHouseBaseData = useMemo(() => {
    return data.filter((row) => {
      // cluster filter
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      // department filter
      if (showDicFilter && selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(row.department || row.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      }
      return true;
    });
  }, [data, selectedClusters, selectedDics, showDicFilter]);

  const inHouseCount = useMemo(
    () => inHouseBaseData.filter((row) => checkIsInHouse(row)).length,
    [inHouseBaseData],
  );
  const nonInHouseCount = inHouseBaseData.length - inHouseCount;

  // Helper: set filter + reset pagination
  const setFilter = (setter) => (val) => {
    setter(val);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="space-y-3">
      {/* ── Baris 1: Search full width ── */}
      <div className="flex items-center gap-2">
        <InputGroup className="w-full">
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
            className="text-sm"
          />
        </InputGroup>
        {/* Columns toggle (push ke kanan) */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="secondary" size="lg" className="text-xs gap-1">
                  <HugeiconsIcon icon={Columns3CogIcon} className="size-3.5" />
                  <span className="hidden lg:inline-block">Columns</span>
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
                      className="capitalize text-xs"
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

      {/* ── Filter + Actions ──
          Mobile  : tiap pasang button dalam grid 2-kolom (w-full per button)
          Desktop : lg:contents membuat wrapper "hilang", semua item jadi flex child langsung
      */}
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        {/* Baris 1: Reset Filter + Cluster */}
        <div className="flex items-center gap-1.5 lg:contents">
          {(filterRoomStatus !== "all" ||
            filterCloseOut !== "all" ||
            filterWoStatus !== "all" ||
            filterEngineer !== "all" ||
            filterWoByOwner !== "all" ||
            filterPostCharge !== "all" ||
            filterBreakContract !== "all" ||
            selectedDics.length < ALL_DICS.length) && (
            <Button
              variant="destructive"
              onClick={() => {
                setFilterRoomStatus("all");
                setFilterCloseOut("all");
                setFilterWoStatus("all");
                setFilterEngineer("all");
                setFilterWoByOwner("all");
                setFilterPostCharge("all");
                setFilterBreakContract("all");
                setFilterInHouse("all");
                setSelectedDics(ALL_DICS);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="text-xs gap-1 flex-1 lg:flex-none"
            >
              <HugeiconsIcon icon={Refresh03Icon} className="size-3.5" />
              <span>Reset Filter</span>
            </Button>
          )}
          {clusters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="secondary" className="text-xs gap-1 flex-1 lg:flex-none">
                    <HugeiconsIcon icon={MosqueLocationIcon} className="size-3.5" />
                    Cluster
                    <Badge variant="default" className="font-semibold text-[10px] h-4 px-1.5">
                      {selectedClusters.length || "All"}
                    </Badge>
                    <ChevronDownIcon className="size-3" />
                  </Button>
                }
              />
              <DropdownMenuContent
                align="start"
                className="w-70 max-h-64 overflow-y-auto uppercase"
              >
                <DropdownMenuGroup className="text-xs">
                  <DropdownMenuLabel className="capitalize">Filter Cluster:</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {clusters.map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c}
                      checked={selectedClusters.includes(c)}
                      onCheckedChange={() => toggleCluster(c)}
                      className="text-xs"
                    >
                      {c}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Baris 2: Department + Engineer */}
        {(showDicFilter || showEngineerFilter) && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            {showDicFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${selectedDics.length < ALL_DICS.length ? "border-primary text-primary" : ""}`}
                    >
                      <HugeiconsIcon icon={DepartementIcon} className="size-3" />
                      Department
                      {selectedDics.length < ALL_DICS.length && (
                        <Badge variant="default" className="font-semibold text-[10px] h-4 px-1.5">
                          {selectedDics.length || "All"}
                        </Badge>
                      )}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Filter Department In Charge</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_DICS.map((dic) => (
                      <DropdownMenuCheckboxItem
                        key={dic}
                        checked={selectedDics.includes(dic)}
                        onCheckedChange={() => toggleDic(dic)}
                        className="text-xs"
                      >
                        {dic}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showEngineerFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterEngineer !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Engineer:{" "}
                      {filterEngineer === "all"
                        ? "Semua"
                        : filterEngineer.charAt(0).toUpperCase() + filterEngineer.slice(1)}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Engineer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Assigned", value: "assigned" },
                      { label: "Unassigned", value: "unassigned" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterEngineer === value}
                        onCheckedChange={() =>
                          setFilter(setFilterEngineer)(filterEngineer === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Baris 3: Room Status + Close Out */}
        {(showRoomStatusFilter || showCloseOutFilter) && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            {showRoomStatusFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterRoomStatus !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Room Status:{" "}
                      {filterRoomStatus === "all"
                        ? "Semua"
                        : filterRoomStatus === "nostatus"
                          ? "No Status"
                          : filterRoomStatus.charAt(0).toUpperCase() + filterRoomStatus.slice(1)}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Room Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Minor", value: "minor" },
                      { label: "Major", value: "major" },
                      { label: "No Status (—)", value: "nostatus" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterRoomStatus === value}
                        onCheckedChange={() =>
                          setFilter(setFilterRoomStatus)(filterRoomStatus === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showCloseOutFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterCloseOut !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Close Out:{" "}
                      {filterCloseOut === "all"
                        ? "Semua"
                        : filterCloseOut === "closeout"
                          ? "Close Out"
                          : "Open"}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Close Out Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Open", value: "open" },
                      { label: "Close Out", value: "closeout" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterCloseOut === value}
                        onCheckedChange={() =>
                          setFilter(setFilterCloseOut)(filterCloseOut === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Baris 4: Status WO + Break Contract */}
        {(showWoStatusFilter || showBreakContractFilter) && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            {showWoStatusFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterWoStatus !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Status WO:{" "}
                      {filterWoStatus === "all"
                        ? "Semua"
                        : filterWoStatus === "onprogress"
                          ? "On Progress"
                          : filterWoStatus.charAt(0).toUpperCase() + filterWoStatus.slice(1)}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Status WO</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "New", value: "new" },
                      { label: "On Progress", value: "onprogress" },
                      { label: "Completed", value: "completed" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterWoStatus === value}
                        onCheckedChange={() =>
                          setFilter(setFilterWoStatus)(filterWoStatus === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showBreakContractFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterBreakContract !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Break Contract:{" "}
                      {filterBreakContract === "all" ? "Semua" : filterBreakContract.toUpperCase()}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Break Contract</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterBreakContract === value}
                        onCheckedChange={() =>
                          setFilter(setFilterBreakContract)(
                            filterBreakContract === value ? "all" : value,
                          )
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Baris 5: WO By Owner + Post Charge */}
        {(showWoManageByOwnerFilter || showPostChargeFilter) && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            {showWoManageByOwnerFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterWoByOwner !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      WO By Owner:{" "}
                      {filterWoByOwner === "all" ? "Semua" : filterWoByOwner.toUpperCase()}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>WO By Owner</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterWoByOwner === value}
                        onCheckedChange={() =>
                          setFilter(setFilterWoByOwner)(filterWoByOwner === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showPostChargeFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`text-xs gap-1 w-full lg:w-auto ${filterPostCharge !== "all" ? "border-primary text-primary" : ""}`}
                    >
                      Post Charge:{" "}
                      {filterPostCharge === "all" ? "Semua" : filterPostCharge.toUpperCase()}
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>WO Post Charge</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { label: "Semua", value: "all" },
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ].map(({ label, value }) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={filterPostCharge === value}
                        onCheckedChange={() =>
                          setFilter(setFilterPostCharge)(filterPostCharge === value ? "all" : value)
                        }
                        className="text-xs"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Baris 6: In-House + Non In-House */}
        {showInHouseFilter && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            <Button
              variant={filterInHouse === "inhouse" ? "default" : "outline"}
              className="text-xs gap-1.5 w-full lg:w-auto"
              onClick={() =>
                setFilter(setFilterInHouse)(filterInHouse === "inhouse" ? "all" : "inhouse")
              }
            >
              In-House
              <Badge
                variant={filterInHouse === "inhouse" ? "secondary" : "default"}
                className="text-[10px] h-4 px-1.5 font-semibold"
              >
                {inHouseCount}
              </Badge>
            </Button>
            <Button
              variant={filterInHouse === "noninhouse" ? "default" : "outline"}
              className="text-xs gap-1.5 w-full lg:w-auto"
              onClick={() =>
                setFilter(setFilterInHouse)(filterInHouse === "noninhouse" ? "all" : "noninhouse")
              }
            >
              Non In-House
              <Badge
                variant={filterInHouse === "noninhouse" ? "secondary" : "default"}
                className="text-[10px] h-4 px-1.5 font-semibold"
              >
                {nonInHouseCount}
              </Badge>
            </Button>
          </div>
        )}

        {/* Baris 7: Extend + Move */}
        {selectedRows.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            <Button
              variant="secondary"
              className="text-xs gap-1 w-full lg:w-auto"
              onClick={() => setExtendOpen(true)}
            >
              <HugeiconsIcon icon={ClockPlusIcon} className="size-3.5" />
              Extend
              <Badge variant="default" className="font-semibold text-[10px] h-4 px-1.5">
                {selectedRows.length}
              </Badge>
            </Button>
            {showMoveButton ? (
              <Button
                variant="secondary"
                className="text-xs gap-1 w-full lg:w-auto"
                onClick={() => setMoveOpen(true)}
              >
                <HugeiconsIcon icon={CalendarDate1Icon} className="size-3.5" />
                Move
                <Badge variant="default" className="font-semibold text-[10px] h-4 px-1.5">
                  {selectedRows.length}
                </Badge>
              </Button>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border overflow-x-auto mt-4">
        <Table>
          <TableHeader className="bg-card h-14">
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

      <div className="flex flex-col items-start justify-between py-2 lg:flex-row gap-4 text-sm text-muted-foreground">
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
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue>
                {pageSizes.find((ps) => ps.value === String(pagination.pageSize))?.label ??
                  `${pagination.pageSize} / Page`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizes.map((ps) => (
                  <SelectItem key={ps.value} value={ps.value} className="text-xs">
                    {ps.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Typography as="span" className="text-xs px-2">
              {pageIndex + 1} / {pageCount}
            </Typography>
            <Button
              variant="secondary"

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
