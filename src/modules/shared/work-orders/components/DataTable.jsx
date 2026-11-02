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
import {
  checkIsInHouse,
  getBreakContractNotice,
  getDepartmentCategory,
} from "@/modules/shared/work-orders/lib";
import {
  BedIcon,
  CalendarDate1Icon,
  ClockPlusIcon,
  Columns3CogIcon,
  DepartementIcon,
  DoorOpenIcon,
  FileRemoveIcon,
  Invoice01Icon,
  Key01Icon,
  LockKeyholeIcon,
  MosqueLocationIcon,
  Progress01Icon,
  Refresh03Icon,
  Route01Icon,
  Search01Icon,
  UserCheck01Icon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { flexRender, useTable } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, FileX2Icon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { WorkOrderTableFeatures } from "./DataTableFeatures";
import { ExtendDialog } from "./ExtendDialog";
import { MoveDialog } from "./MoveDialog";

/* ────────────────────────────────────────────────────────────
 * Konstanta
 * ──────────────────────────────────────────────────────────── */

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

/*
 * Layout filter bar
 *
 * Mobile (< lg):
 *  - Filter dikelompokkan per baris (FILTER_ROW), tiap baris berisi sepasang filter.
 *  - Tiap tombol berukuran setengah baris (basis 50%) dan min-w-max: kalau teksnya
 *    (misal "Tracing: Rejected WO Guarantee") lebih lebar dari setengah baris, tombol
 *    tidak bisa menyusut → otomatis turun baris sendiri dan melebar penuh (grow).
 *    Kalau teksnya muat, tetap setengah baris. Murni CSS, tanpa hitung JS.
 *
 * Desktop (>= lg):
 *  - FILTER_ROW jadi `contents` (wrapper hilang) sehingga semua tombol mengalir
 *    langsung di flex-wrap induknya, melebar mengisi sisa baris seperti sebelumnya.
 */

// Wrapper satu baris filter di mobile. empty:hidden → baris kosong (semua filter di
// dalamnya disembunyikan lewat prop show*) tidak memakan ruang/gap.
const FILTER_ROW = "flex w-full flex-wrap items-center gap-2 empty:hidden lg:contents";

// Semua tombol punya `grow`. Selama sepasang filter muat satu baris, keduanya setengah
// baris (grow tidak berefek karena tidak ada sisa ruang). Begitu salah satu (yang aktif)
// terlalu lebar dan turun baris, pasangannya otomatis ikut sendirian di barisnya dan
// `grow` membuat keduanya sama-sama melebar penuh. Murni CSS → tanpa ukur lewat JS,
// jadi tidak ada glitch/lompatan.

// Tombol filter TIDAK aktif: setengah baris (min-w-0 → boleh menyusut, label dipotong "…"
// kalau terpaksa), jadi tidak pernah memaksa dirinya turun baris.
//
// Anti-flicker:
//  - basis = 50% - 0.5rem (bukan 0.25rem): dua tombol + gap sengaja menyisakan ±0.5rem,
//    supaya pembulatan sub-pixel tidak bikin pasangan yang "pas" tiba-tiba dianggap
//    tidak muat lalu loncat baris. Sisa ruang itu langsung diisi oleh `grow`.
//  - transisi dibatasi ke warna/shadow saja (bukan transition-all) supaya perubahan
//    lebar/ukuran tidak dianimasikan setengah-setengah saat baris berpindah.
const FILTER_BTN =
  "min-w-0 max-w-full grow basis-[calc(50%-0.5rem)] justify-between gap-1.5 text-xs transition-[color,background-color,box-shadow] lg:min-w-56 lg:flex-1 lg:basis-60";

// Tombol filter AKTIF: lebar minimum = lebar teksnya (min-w-max). Kalau muat setengah
// baris tetap setengah; kalau tidak, dia turun baris dan pasangannya ikut (lihat atas).
const FILTER_BTN_ACTIVE =
  "min-w-max max-w-full grow basis-[calc(50%-0.5rem)] justify-between gap-1.5 text-xs transition-[color,background-color,box-shadow] lg:min-w-56 lg:flex-1 lg:basis-60";

// Cluster: sama dengan filter lain di mobile; di desktop sedikit lebih ramping.
const CLUSTER_BTN =
  "min-w-0 max-w-full grow basis-[calc(50%-0.5rem)] justify-between gap-1.5 text-xs transition-[color,background-color,box-shadow] lg:min-w-56 lg:flex-1 lg:basis-40";

// In-House / Non In-House: selalu berpasangan 50/50 di mobile.
const COUNT_BTN = "min-w-0 flex-1 basis-0 justify-between gap-1.5 text-xs";

// Wrapper pasangan In-House + Non In-House: satu baris penuh di mobile,
// satu item flex di desktop sehingga keduanya tidak pernah terpisah baris.
const COUNT_PAIR = "flex w-full items-center gap-2 lg:w-auto lg:min-w-72 lg:flex-1 lg:basis-80";

// Penanda filter aktif untuk tombol variant secondary (tanpa border)
const ACTIVE_RING = "text-primary ring-1 ring-primary/50";

const YES_NO_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const ENGINEER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Assigned", value: "assigned" },
  { label: "Unassigned", value: "unassigned" },
];

const ROOM_STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Minor", value: "minor" },
  { label: "Major", value: "major" },
  { label: "No Status", value: "nostatus" },
];

const CLOSE_OUT_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Close Out", value: "closeout" },
];

const WO_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "On Progress", value: "onprogress" },
  { label: "Completed", value: "completed" },
];

const TRACING_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Arrived", value: "arrived" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Rejected Guarantee", value: "rejected_wo_guarantee" },
];

export function getRowTracingScheduleStatus(row) {
  const traceStatus = String(
    row?.reservationtraces_status ||
      row?.reservationtrace_status ||
      row?.traces_status ||
      row?.tracingSchedule?.[0]?.status ||
      row?.tracing_schedule?.[0]?.status ||
      "",
  ).trim();

  const rejectDate =
    row?.rejected_wo_guarantee_date &&
    row?.rejected_wo_guarantee_date !== "—" &&
    row?.rejected_wo_guarantee_date !== "-"
      ? row.rejected_wo_guarantee_date
      : null;

  const isRejectedGuarantee =
    Boolean(rejectDate) ||
    /rejected\s+wo\s+guarantee/i.test(traceStatus) ||
    (Array.isArray(row?.tracingSchedule) &&
      row.tracingSchedule.some(
        (t) =>
          (Boolean(t?.rejected_wo_guarantee_date) &&
            t?.rejected_wo_guarantee_date !== "—" &&
            t?.rejected_wo_guarantee_date !== "-") ||
          /rejected\s+wo\s+guarantee/i.test(String(t?.status || "")),
      )) ||
    (Array.isArray(row?.tracing_schedule) &&
      row.tracing_schedule.some(
        (t) =>
          (Boolean(t?.rejected_wo_guarantee_date) &&
            t?.rejected_wo_guarantee_date !== "—" &&
            t?.rejected_wo_guarantee_date !== "-") ||
          /rejected\s+wo\s+guarantee/i.test(String(t?.status || "")),
      ));

  if (isRejectedGuarantee) return "rejected_wo_guarantee";
  if (/rejected/i.test(traceStatus)) return "rejected";
  if (/completed/i.test(traceStatus)) return "completed";
  if (/arrived/i.test(traceStatus)) return "arrived";
  if (/pending/i.test(traceStatus)) return "pending";
  return "new";
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

/* ────────────────────────────────────────────────────────────
 * Komponen kecil (dipakai ulang supaya JSX utama tidak panjang)
 * ──────────────────────────────────────────────────────────── */

/** Dropdown filter single-select: klik opsi aktif lagi → kembali ke "all". */
function FilterDropdown({ icon, label, title, value, options, onChange }) {
  const isActive = value !== "all";
  const current = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={isActive ? "default" : "secondary"}
            className={isActive ? FILTER_BTN_ACTIVE : FILTER_BTN}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {icon && <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />}
              <span
                className={`min-w-0 truncate ${isActive ? "text-secondary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              <Badge
                variant={isActive ? "secondary" : "default"}
                className={`h-4 shrink-0 px-1.5 text-[10px] ${isActive ? "font-normal" : "font-semibold"}`}
              >
                {current?.label ?? "All"}
              </Badge>
            </span>
            <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{title ?? label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={value === opt.value}
              onCheckedChange={() => onChange(value === opt.value ? "all" : opt.value)}
              className="text-xs"
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tombol toggle dengan badge hitungan (In-House / Non In-House). */
function CountToggle({ icon, active, label, count, onClick }) {
  return (
    <Button variant={active ? "default" : "secondary"} className={COUNT_BTN} onClick={onClick}>
      <span className="flex min-w-0 items-center gap-1.5">
        {icon && <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </span>
      <Badge
        variant={active ? "secondary" : "default"}
        className="h-4 px-1.5 text-[10px] font-semibold"
      >
        {count}
      </Badge>
    </Button>
  );
}

/* ────────────────────────────────────────────────────────────
 * Komponen utama
 * ──────────────────────────────────────────────────────────── */

export function DataTable({
  data = [],
  columns = [],
  dateRange,
  reportType,
  showInHouseFilter,
  showRoomStatusFilter,
  showCloseOutFilter,
  showWoStatusFilter,
  showTracingScheduleFilter = true,
  showEngineerFilter,
  showDicFilter,
  showWoManageByOwnerFilter,
  showPostChargeFilter,
  showBreakContractFilter,
  showMoveButton,
  hideReportAndExport,
  initialColumnVisibility = {},
  selectedClusters: externalClusters,
  onSelectedClustersChange,
  selectedDics: externalDics,
  onSelectedDicsChange,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalClusters, setInternalClusters] = useState([]);
  const selectedClusters = externalClusters !== undefined ? externalClusters : internalClusters;
  const setSelectedClusters = onSelectedClustersChange || setInternalClusters;

  // [] = "All" (tidak ada filter DIC spesifik), array isi = filter DIC tertentu
  const [internalDics, setInternalDics] = useState([]);
  const selectedDics = externalDics !== undefined ? externalDics : internalDics;
  const setSelectedDics = onSelectedDicsChange || setInternalDics;

  // Filter single-select ("all" = tanpa filter)
  const [filterWoStatus, setFilterWoStatus] = useState("all"); // "all"|"new"|"onprogress"|"completed"
  const [filterTracingStatus, setFilterTracingStatus] = useState("all");
  const [filterInHouse, setFilterInHouse] = useState("all"); // "all"|"inhouse"|"noninhouse"
  const [filterEngineer, setFilterEngineer] = useState("all"); // "all"|"assigned"|"unassigned"
  const [filterRoomStatus, setFilterRoomStatus] = useState("all"); // "all"|"minor"|"major"|"nostatus"
  const [filterCloseOut, setFilterCloseOut] = useState("all"); // "all"|"open"|"closeout"
  const [filterWoByOwner, setFilterWoByOwner] = useState("all"); // "all"|"yes"|"no"
  const [filterPostCharge, setFilterPostCharge] = useState("all"); // "all"|"yes"|"no"
  const [filterBreakContract, setFilterBreakContract] = useState("all"); // "all"|"yes"|"no"

  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [extendOpen, setExtendOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [clusterSearch, setClusterSearch] = useState("");

  const pathname = usePathname();
  const isActionDatesPage = pathname === "/dashboard/action-dates";

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

  // Cluster yang tampil di dropdown — difilter berdasarkan input pencarian
  const filteredClusters = useMemo(() => {
    if (!clusterSearch.trim()) return clusters;
    const q = clusterSearch.toLowerCase();
    return clusters.filter((c) => c.toLowerCase().includes(q));
  }, [clusters, clusterSearch]);

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

      // --- Tracing Schedule Status filter ---
      if (showTracingScheduleFilter && filterTracingStatus !== "all") {
        const rowTracingStatus = getRowTracingScheduleStatus(row);
        if (rowTracingStatus !== filterTracingStatus) return false;
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
        const hasNotice = Boolean(getBreakContractNotice(row));
        const matchesBreak = isBreak || hasNotice;
        if (filterBreakContract === "yes" && !matchesBreak) return false;
        if (filterBreakContract === "no" && matchesBreak) return false;
      }

      return true;
    });
  }, [
    data,
    selectedClusters,
    selectedDics,
    filterWoStatus,
    filterTracingStatus,
    showDicFilter,
    showWoStatusFilter,
    showTracingScheduleFilter,
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

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().rows.map((r) => r.original);
  }, [table]);

  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  // Helper: set filter + reset halaman ke 1
  const setFilter = (setter) => (val) => {
    setter(val);
    resetPage();
  };

  const toggleCluster = (cluster) => {
    setSelectedClusters((prev) =>
      prev.includes(cluster) ? prev.filter((c) => c !== cluster) : [...prev, cluster],
    );
    resetPage();
  };

  const toggleDic = (dic) => {
    setSelectedDics((prev) => {
      const next = prev.includes(dic) ? prev.filter((d) => d !== dic) : [...prev, dic];
      // Semua terpilih / tidak ada yang terpilih → kembali ke "All" (empty)
      return next.length === 0 || next.length === ALL_DICS.length ? [] : next;
    });
    resetPage();
  };

  // Hitungan In-House / Non In-House dari data yang sudah difilter cluster & DIC,
  // tapi TIDAK dipengaruhi filterInHouse sendiri → badge selalu menunjukkan total per cluster.
  const inHouseBaseData = useMemo(() => {
    return data.filter((row) => {
      if (selectedClusters.length > 0) {
        const c = String(row.cluster || row.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
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

  const hasActiveFilters =
    filterRoomStatus !== "all" ||
    filterCloseOut !== "all" ||
    filterWoStatus !== "all" ||
    filterTracingStatus !== "all" ||
    filterEngineer !== "all" ||
    filterWoByOwner !== "all" ||
    filterPostCharge !== "all" ||
    filterBreakContract !== "all" ||
    filterInHouse !== "all" ||
    selectedDics.length > 0;

  const resetAllFilters = () => {
    setFilterRoomStatus("all");
    setFilterCloseOut("all");
    setFilterWoStatus("all");
    setFilterTracingStatus("all");
    setFilterEngineer("all");
    setFilterWoByOwner("all");
    setFilterPostCharge("all");
    setFilterBreakContract("all");
    setFilterInHouse("all");
    setSelectedDics([]);
    setRowSelection({}); // batalkan semua centang baris
    resetPage();
  };

  const hasAnyFilterBar =
    clusters.length > 0 ||
    showDicFilter ||
    showEngineerFilter ||
    showRoomStatusFilter ||
    showCloseOutFilter ||
    showWoStatusFilter ||
    showTracingScheduleFilter ||
    showBreakContractFilter ||
    showWoManageByOwnerFilter ||
    showPostChargeFilter ||
    showInHouseFilter ||
    hasActiveFilters ||
    selectedRows.length > 0;

  return (
    <div className="space-y-4">
      {/* ── Search + Columns ── */}
      <div className="flex items-center gap-2">
        <InputGroup className="w-full">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari di sini..."
            value={globalFilter ?? ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              resetPage();
            }}
            className="text-sm"
          />
        </InputGroup>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="secondary" size="lg" className="shrink-0 gap-1.5 text-xs">
                <HugeiconsIcon icon={Columns3CogIcon} className="size-3.5" />
                <span className="hidden lg:inline-block">Columns</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="max-h-64 w-48 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="text-xs capitalize"
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

      {/* ── Filter bar ──
       *  Urutan baris di mobile:
       *  1. Cluster, Department
       *  2. Engineer, Tracing
       *  3. Room Status, Close Out
       *  4. Status WO, Break Contract
       *  5. WO By Owner, Post Charge
       *  6. In-House, Non In-House
       *  7. Extend, Move (muncul saat ada baris terpilih; Move hanya di action dates)
       *  8. Reset Filter
       */}
      {hasAnyFilterBar && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Baris 1: Cluster, Department */}
          <div className={FILTER_ROW}>
            {clusters.length > 0 && (
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) setClusterSearch("");
                }}
              >
                <DropdownMenuTrigger
                  render={
                    <Button variant="secondary" className={CLUSTER_BTN}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <HugeiconsIcon icon={MosqueLocationIcon} className="size-3.5 shrink-0" />
                        <span className="truncate">Cluster</span>
                        <Badge variant="default" className="h-4 px-1.5 text-[10px] font-semibold">
                          {selectedClusters.length || "All"}
                        </Badge>
                      </span>
                      <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-72 overflow-hidden p-0">
                  <div className="sticky top-0 z-10 border-b bg-popover p-2">
                    <InputGroup className="h-7 w-full">
                      <InputGroupAddon>
                        <HugeiconsIcon
                          icon={Search01Icon}
                          className="size-4 text-muted-foreground"
                        />
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

                  <DropdownMenuGroup>
                    <div className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
                      {filteredClusters.length > 0 ? (
                        filteredClusters.map((c) => (
                          <DropdownMenuCheckboxItem
                            key={c}
                            checked={selectedClusters.includes(c)}
                            onCheckedChange={() => toggleCluster(c)}
                            onSelect={(e) => e.preventDefault()}
                            className="text-xs uppercase"
                          >
                            <span className="min-w-0 truncate">{c}</span>
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <div className="px-3 py-8 text-center">
                          <HugeiconsIcon
                            icon={Search01Icon}
                            className="mx-auto mb-2 size-5 text-muted-foreground/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tidak ada cluster ditemukan
                          </p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuGroup>

                  {selectedClusters.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="m-0" />
                      <div className="p-1.5">
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => setSelectedClusters([])}
                          className="w-full text-xs"
                        >
                          Reset filter
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showDicFilter && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="secondary"
                      className={`${FILTER_BTN} ${selectedDics.length > 0 ? ACTIVE_RING : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <HugeiconsIcon icon={DepartementIcon} className="size-3.5 shrink-0" />
                        <span className="truncate">Department</span>
                        <Badge variant="default" className="h-4 px-1.5 text-[10px] font-semibold">
                          {selectedDics.length || "All"}
                        </Badge>
                      </span>
                      <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Department In Charge</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_DICS.map((dic) => {
                      const isEngineering = dic === "Engineering";
                      return (
                        <DropdownMenuCheckboxItem
                          key={dic}
                          checked={isActionDatesPage ? isEngineering : selectedDics.includes(dic)}
                          disabled={isActionDatesPage && !isEngineering}
                          onCheckedChange={() => {
                            if (isActionDatesPage) return;
                            toggleDic(dic);
                          }}
                          className="text-xs"
                        >
                          {dic}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                    {!isActionDatesPage && selectedDics.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                          <Button
                            variant="default"
                            size="xs"
                            className="w-full text-xs"
                            onClick={() => {
                              setSelectedDics([]);
                              resetPage();
                            }}
                          >
                            Reset DIC
                          </Button>
                        </div>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Baris 2: Engineer, Tracing */}
          <div className={FILTER_ROW}>
            {showEngineerFilter && (
              <FilterDropdown
                icon={UserSettings01Icon}
                label="Engineer"
                title="Engineer"
                value={filterEngineer}
                options={ENGINEER_OPTIONS}
                onChange={setFilter(setFilterEngineer)}
              />
            )}
            {showTracingScheduleFilter && (
              <FilterDropdown
                icon={Route01Icon}
                label="Tracing"
                title="Tracing Schedule Status"
                value={filterTracingStatus}
                options={TRACING_STATUS_FILTER_OPTIONS}
                onChange={setFilter(setFilterTracingStatus)}
              />
            )}
          </div>

          {/* Baris 3: Room Status, Close Out */}
          <div className={FILTER_ROW}>
            {showRoomStatusFilter && (
              <FilterDropdown
                icon={BedIcon}
                label="Room Status"
                title="Room Status"
                value={filterRoomStatus}
                options={ROOM_STATUS_OPTIONS}
                onChange={setFilter(setFilterRoomStatus)}
              />
            )}
            {showCloseOutFilter && (
              <FilterDropdown
                icon={LockKeyholeIcon}
                label="Close Out"
                title="Close Out Status"
                value={filterCloseOut}
                options={CLOSE_OUT_OPTIONS}
                onChange={setFilter(setFilterCloseOut)}
              />
            )}
          </div>

          {/* Baris 4: Status WO, Break Contract */}
          <div className={FILTER_ROW}>
            {showWoStatusFilter && (
              <FilterDropdown
                icon={Progress01Icon}
                label="Status WO"
                title="Status WO"
                value={filterWoStatus}
                options={WO_STATUS_FILTER_OPTIONS}
                onChange={setFilter(setFilterWoStatus)}
              />
            )}
            {showBreakContractFilter && (
              <FilterDropdown
                icon={FileRemoveIcon}
                label="Break Contract"
                title="Break Contract"
                value={filterBreakContract}
                options={YES_NO_OPTIONS}
                onChange={setFilter(setFilterBreakContract)}
              />
            )}
          </div>

          {/* Baris 5: WO By Owner, Post Charge */}
          <div className={FILTER_ROW}>
            {showWoManageByOwnerFilter && (
              <FilterDropdown
                icon={Key01Icon}
                label="By Owner"
                title="WO By Owner"
                value={filterWoByOwner}
                options={YES_NO_OPTIONS}
                onChange={setFilter(setFilterWoByOwner)}
              />
            )}
            {showPostChargeFilter && (
              <FilterDropdown
                icon={Invoice01Icon}
                label="Post Charge"
                title="WO Post Charge"
                value={filterPostCharge}
                options={YES_NO_OPTIONS}
                onChange={setFilter(setFilterPostCharge)}
              />
            )}
          </div>

          {/* Baris 6: In-House, Non In-House */}
          {showInHouseFilter && (
            <div className={COUNT_PAIR}>
              <CountToggle
                active={filterInHouse === "inhouse"}
                icon={UserCheck01Icon}
                label="In-House"
                count={inHouseCount}
                onClick={() =>
                  setFilter(setFilterInHouse)(filterInHouse === "inhouse" ? "all" : "inhouse")
                }
              />
              <CountToggle
                active={filterInHouse === "noninhouse"}
                icon={DoorOpenIcon}
                label="Non In-House"
                count={nonInHouseCount}
                onClick={() =>
                  setFilter(setFilterInHouse)(filterInHouse === "noninhouse" ? "all" : "noninhouse")
                }
              />
            </div>
          )}

          {/* Baris 7: Extend, Move */}
          {selectedRows.length > 0 && (
            <div className="flex w-full items-center gap-2">
              <Button
                variant="secondary"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => setExtendOpen(true)}
              >
                <HugeiconsIcon icon={ClockPlusIcon} className="size-3.5" />
                Extend
                <Badge variant="default" className="h-4 px-1.5 text-[10px] font-semibold">
                  {selectedRows.length}
                </Badge>
              </Button>
              {showMoveButton && (
                <Button
                  variant="secondary"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => setMoveOpen(true)}
                >
                  <HugeiconsIcon icon={CalendarDate1Icon} className="size-3.5" />
                  Move
                  <Badge variant="default" className="h-4 px-1.5 text-[10px] font-semibold">
                    {selectedRows.length}
                  </Badge>
                </Button>
              )}
            </div>
          )}

          {/* Baris 8: Reset Filter (selalu satu baris penuh paling bawah) */}
          {hasActiveFilters && (
            <Button
              variant="destructive"
              onClick={resetAllFilters}
              className="w-full basis-full gap-1.5 text-xs"
            >
              <HugeiconsIcon icon={Refresh03Icon} className="size-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      )}

      {/* ── Tabel ── */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-linear-to-t from-primary/5 to-card">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-b hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-12 whitespace-nowrap px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <FileX2Icon className="size-8 opacity-50" />
                      <p className="text-sm">Tidak ada data work order.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Footer: info + pagination ── */}
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between justify-center items-center">
        <p className="text-xs sm:text-sm">
          Showing{" "}
          <span className="font-medium text-foreground">{table.getRowModel().rows.length}</span> of{" "}
          <span className="font-medium text-foreground">{filteredData.length}</span> entries
        </p>

        <div className="flex items-center gap-3">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(val) =>
              setPagination((p) => ({ ...p, pageSize: Number(val), pageIndex: 0 }))
            }
          >
            <SelectTrigger className="h-8 w-32 text-xs">
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
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Typography as="span" className="min-w-14 px-1 text-center text-xs tabular-nums">
              {pageIndex + 1} / {pageCount}
            </Typography>
            <Button
              variant="secondary"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Halaman berikutnya"
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
