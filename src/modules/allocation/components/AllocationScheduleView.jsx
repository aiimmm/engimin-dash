"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
import { cn, getWorkOrderTracingUrl } from "@/lib/utils";
import {
  generateAllocationReport,
  groupAllocationByEngineer,
} from "@/modules/allocation/lib/reports";
import {
  AppleReminderIcon,
  DoorOpenIcon,
  UserCheck01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon, FilterXIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Warna titik status — kecil & lembut supaya tidak melelahkan mata */
const DOT_CLASSES = {
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  neutral: "bg-neutral-400",
};

/** Kelas tombol toggle hitungan */
const COUNT_BTN = "h-8 justify-between gap-2 rounded-full px-3 text-xs";

/** Kelas tombol dropdown filter */
const FILTER_BTN = "h-8 justify-between gap-2 rounded-full px-3 text-xs";
const FILTER_BTN_ACTIVE = FILTER_BTN;

/** Opsi filter status schedule ("All" = default, ditangani lewat value "all") */
const STATUS_OPTIONS = [
  { value: "rejected", label: "Rejected" },
  { value: "rejected-guarantee", label: "Rejected Guarantee" },
  { value: "completed", label: "Completed" },
];

/**
 * Cocokkan baris dengan filter status.
 * - Rejected: hanya Rejected biasa (Rejected Guarantee punya filter sendiri)
 * - Completed: gabungan Done by Eng dan Done by Admin
 */
function matchesScheduleStatus(row, status) {
  switch (status) {
    case "rejected-guarantee":
      return !!row.isRejectedGuarantee;
    case "rejected":
      return !row.isRejectedGuarantee && !!row.isRejected;
    case "completed":
      return !!row.isDoneByEng || !!row.isDoneByAdmin;
    default:
      return true;
  }
}

/**
 * Tentukan tipe in-house dari teks status.
 * Sesuaikan dengan nilai data kamu (atau pakai boolean kalau sudah ada, mis. row.isInHouse).
 */
function getInHouseType(row) {
  const s = String(row.inHouseStatus || "").toLowerCase();
  return s.includes("non") ? "noninhouse" : "inhouse";
}

/** Status ringkas: titik berwarna + teks netral */
function StatusDot({ tone = "red", children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}

/** Pemisah kecil antar info dalam satu baris */
function Dot() {
  return (
    <span aria-hidden className="text-muted-foreground/40">
      •
    </span>
  );
}

/** Tombol toggle dengan badge hitungan (In-House / Non In-House / Guest Appointment). */
function CountToggle({ icon, active, label, count, onClick, className }) {
  return (
    <Button
      variant={active ? "default" : "secondary"}
      className={cn(COUNT_BTN, className)}
      onClick={onClick}
    >
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

/** Tombol dropdown filter dengan badge nilai terpilih + tombol reset di bagian bawah. */
function FilterDropdown({ icon, label, title, options, value, onChange, className }) {
  const current = options.find((o) => o.value === value);
  const isActive = value !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={isActive ? "default" : "secondary"}
            className={cn(isActive ? FILTER_BTN_ACTIVE : FILTER_BTN, className)}
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

        {/* Reset filter ini */}
        <DropdownMenuSeparator />
        <div>
          <Button
            variant="destructive"
            size="xs"
            disabled={!isActive}
            onClick={() => onChange("all")}
            className="w-full text-xs"
          >
            Reset
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Ambil inisial (maks. 2 huruf) dari nama engineer */
function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Satu baris work order — tanpa card, murni list.
 * [jam]  Judul WO                      WO-12345
 *        Lokasi • GenID: xxx
 *        ● In-House  ● Guest Appointment
 *        │ catatan
 */
function ScheduleRow({ row }) {
  const rawStatus = String(row.rawRow?.status || "New");
  const tracingHref = getWorkOrderTracingUrl(row.woNo, rawStatus);
  const woNoRef = useRef(null);

  // Klik 1x: select seluruh teks nomor WO
  const handleSelect = () => {
    const el = woNoRef.current;
    if (!el) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Klik 2x: buka link di tab baru
  const handleOpen = () => {
    window.open(tracingHref, "_blank", "noopener,noreferrer");
  };

  return (
    <li className="flex gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:gap-4 sm:px-4">
      {/* Jam */}
      <time className="w-8 shrink-0 font-mono text-[10px] font-semibold tabular-nums text-foreground/80">
        {row.time}
      </time>

      {/* Detail */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Judul + nomor WO */}
        <div className="flex md:flex-row flex-col items-baseline md:justify-between gap-x-3 gap-y-0.5">
          <p className="min-w-0 text-[10px] font-medium leading-snug text-foreground wrap-break-word">
            {row.woTypeTitle}
          </p>
          <span
            ref={woNoRef}
            role="link"
            tabIndex={0}
            title="Klik 1x untuk select, klik 2x untuk buka"
            onClick={handleSelect}
            onDoubleClick={(e) => {
              e.preventDefault();
              handleSelect();
              handleOpen();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOpen();
            }}
            className="shrink-0 cursor-pointer select-all touch-manipulation font-mono text-[10px] font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.woNo}
          </span>
        </div>

        {/* Lokasi & GenID */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <span className="wrap-break-word">{row.location}</span>
          <Dot />
          <span className="font-mono">GenID: {row.genId}</span>
        </p>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <StatusDot tone="red">{row.inHouseStatus}</StatusDot>
          {row.isGuestAppt && <StatusDot tone="indigo">Guest Appointment</StatusDot>}
          {row.isRejectedGuarantee ? (
            <StatusDot tone="red">Rejected Guarantee</StatusDot>
          ) : row.isRejected ? (
            <StatusDot tone="red">Rejected</StatusDot>
          ) : row.isDoneByEng ? (
            <StatusDot tone="emerald">Done by Eng</StatusDot>
          ) : row.isArrived ? (
            <StatusDot tone="blue">Arrived</StatusDot>
          ) : row.isPending ? (
            <StatusDot tone="amber">Pending</StatusDot>
          ) : null}
          {row.isDoneByAdmin && <StatusDot tone="emerald">Done by Admin</StatusDot>}
        </div>

        {/* Catatan */}
        {row.noteLine && (
          <p className="border-l-2 py-0 border-border pl-2.5 text-[10px] italic leading-relaxed text-muted-foreground wrap-break-word">
            {row.noteLine}
          </p>
        )}
      </div>
    </li>
  );
}

/** Satu section engineer: header + list WO */
function EngineerGroup({ group }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b bg-linear-to-t from-primary/5 to-card px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-neutral-200 text-xs font-bold text-foreground dark:border-white/5 dark:bg-neutral-800">
            {getInitials(group.engineerName)}
          </div>
          <h4 className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
            {group.engineerName}
          </h4>
        </div>

        <Badge
          variant="secondary"
          className="shrink-0 rounded-full px-2.5 font-semibold tabular-nums"
        >
          {group.rowCount} Task
        </Badge>
      </header>

      <ul className="divide-y divide-border/60">
        {group.formattedRows.map((row, rIdx) => (
          <ScheduleRow key={`${row.woNo}-${rIdx}`} row={row} />
        ))}
      </ul>
    </section>
  );
}

export const AllocationScheduleView = ({
  data = [],
  tabName = "Engineer Internal",
  date = "",
  selectedClusters = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEngineer, setSelectedEngineer] = useState("ALL");
  const [filterInHouse, setFilterInHouse] = useState("all"); // "all" | "inhouse" | "noninhouse"
  const [filterGuest, setFilterGuest] = useState(false); // true = hanya Guest Appointment
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | nilai di STATUS_OPTIONS

  // Ada filter yang sedang aktif?
  const hasActiveFilter = filterInHouse !== "all" || filterGuest || filterStatus !== "all";

  // Reset semua filter (search tidak ikut direset)
  const handleResetFilters = () => {
    setFilterInHouse("all");
    setFilterGuest(false);
    setFilterStatus("all");
  };

  // Group data by engineer
  const groupedEngineers = useMemo(() => {
    return groupAllocationByEngineer(data);
  }, [data]);

  // Unique engineer options for filter
  const engineerOptions = useMemo(() => {
    return groupedEngineers.map((g) => g.engineerName);
  }, [groupedEngineers]);

  // Filter engineer + search (belum termasuk filter toggle & status)
  const baseGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return groupedEngineers
      .filter((group) => selectedEngineer === "ALL" || group.engineerName === selectedEngineer)
      .map((group) => {
        if (!q) return group;

        const matchingRows = group.formattedRows.filter((r) => {
          return (
            r.mainLine.toLowerCase().includes(q) ||
            r.noteLine.toLowerCase().includes(q) ||
            group.engineerName.toLowerCase().includes(q)
          );
        });

        return {
          ...group,
          rowCount: matchingRows.length,
          header: `${group.engineerName} | ${matchingRows.length} row(s)`,
          formattedRows: matchingRows,
        };
      })
      .filter((group) => group.formattedRows.length > 0);
  }, [groupedEngineers, selectedEngineer, searchQuery]);

  // Hitungan badge: tiap tombol menghitung dengan semua filter lain, kecuali filternya sendiri
  const { inHouseCount, nonInHouseCount, guestCount } = useMemo(() => {
    let inH = 0;
    let nonInH = 0;
    let guest = 0;

    for (const g of baseGroups) {
      for (const r of g.formattedRows) {
        if (!matchesScheduleStatus(r, filterStatus)) continue;

        const type = getInHouseType(r);
        const passGuest = !filterGuest || r.isGuestAppt;
        const passInHouse = filterInHouse === "all" || type === filterInHouse;

        // Hitungan In-House / Non In-House mengikuti filter guest
        if (passGuest) {
          if (type === "inhouse") inH++;
          else nonInH++;
        }

        // Hitungan Guest Appointment mengikuti filter in-house
        if (passInHouse && r.isGuestAppt) guest++;
      }
    }

    return { inHouseCount: inH, nonInHouseCount: nonInH, guestCount: guest };
  }, [baseGroups, filterStatus, filterGuest, filterInHouse]);

  // Terapkan semua filter
  const filteredGroups = useMemo(() => {
    if (!hasActiveFilter) return baseGroups;

    return baseGroups
      .map((group) => {
        const rows = group.formattedRows.filter(
          (r) =>
            (filterInHouse === "all" || getInHouseType(r) === filterInHouse) &&
            (!filterGuest || r.isGuestAppt) &&
            matchesScheduleStatus(r, filterStatus),
        );
        return {
          ...group,
          rowCount: rows.length,
          header: `${group.engineerName} | ${rows.length} row(s)`,
          formattedRows: rows,
        };
      })
      .filter((group) => group.formattedRows.length > 0);
  }, [baseGroups, hasActiveFilter, filterInHouse, filterGuest, filterStatus]);

  const totalFilteredRows = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.formattedRows.length, 0);
  }, [filteredGroups]);

  // Generate copyable text for current view
  const fullReportText = useMemo(() => {
    return generateAllocationReport(data, { date, selectedClusters });
  }, [data, date, selectedClusters]);

  const handleCopy = async () => {
    if (!fullReportText) {
      toast.warning("Tidak ada konten jadwal untuk disalin.");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullReportText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = fullReportText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(`Jadwal (${tabName}) berhasil disalin ke clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying schedule:", error);
      toast.error("Gagal menyalin jadwal ke clipboard.");
    }
  };

  // Jumlah engineer yang tampil (abaikan UNASSIGNED)
  const totalEngineers = useMemo(() => {
    return filteredGroups.filter(
      (g) =>
        String(g.engineerName || "")
          .trim()
          .toUpperCase() !== "UNASSIGNED",
    ).length;
  }, [filteredGroups]);

  return (
    <div>
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={AppleReminderIcon} className="size-5" />
          Schedule {tabName}
        </CardTitle>
        <CardDescription>
          {totalFilteredRows} work order dan {totalEngineers} engineer yang dialokasikan untuk
          cluster {selectedClusters.join(", ")}
        </CardDescription>
      </div>

      <CardContent className="mt-4 p-0 space-y-4">
        {/* Controls Toolbar: Search & filter */}
        <div className="flex flex-col gap-3">
          <InputGroup className="w-full">
            <InputGroupAddon>
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari di sini..."
              className="text-xs"
            />
          </InputGroup>

          {/* Mobile: grid 2 kolom (semua kelihatan). Desktop (sm+): satu baris penuh */}
          <div className="grid w-full grid-cols-2 gap-2 xl:flex xl:flex-nowrap xl:items-center xl:overflow-x-auto xl:scrollbar-none xl:[&::-webkit-scrollbar]:hidden">
            <CountToggle
              className="w-full sm:w-auto sm:min-w-fit sm:flex-1"
              active={filterInHouse === "inhouse"}
              icon={UserCheck01Icon}
              label="In-House"
              count={inHouseCount}
              onClick={() => setFilterInHouse(filterInHouse === "inhouse" ? "all" : "inhouse")}
            />
            <CountToggle
              className="w-full sm:w-auto sm:min-w-fit sm:flex-1"
              active={filterInHouse === "noninhouse"}
              icon={DoorOpenIcon}
              label="Non In-House"
              count={nonInHouseCount}
              onClick={() =>
                setFilterInHouse(filterInHouse === "noninhouse" ? "all" : "noninhouse")
              }
            />
            <CountToggle
              className="w-full sm:w-auto sm:min-w-fit sm:flex-1"
              active={filterGuest}
              icon={UserGroupIcon}
              label="Guest Appointment"
              count={guestCount}
              onClick={() => setFilterGuest((v) => !v)}
            />

            {/* Filter status schedule */}
            <FilterDropdown
              className="w-full sm:w-auto sm:min-w-fit sm:flex-1"
              label="Status"
              title="Schedule Status"
              options={STATUS_OPTIONS}
              value={filterStatus}
              onChange={setFilterStatus}
            />

            {/* Reset semua filter (muncul hanya kalau ada filter aktif) */}
            {hasActiveFilter && (
              <Button
                variant="destructive"
                className="col-span-2 h-8 w-full gap-1.5 rounded-full px-3 text-xs sm:w-auto sm:shrink-0"
                onClick={handleResetFilters}
                aria-label="Reset Filter"
              >
                <FilterXIcon className="size-3.5" />
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Schedule List Content */}
        {filteredGroups.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed p-8 text-center bg-muted/20">
            <div className="space-y-1">
              <UsersIcon className="mx-auto size-8 text-muted-foreground/60" />
              <p className="font-semibold text-sm">Tidak ada jadwal ditemukan</p>
              <p className="text-xs text-muted-foreground">
                Tidak ada data alokasi work order untuk filter yang dipilih.
              </p>
            </div>
          </div>
        ) : (
          // Schedule List Groups
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <EngineerGroup key={group.engineerName} group={group} />
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};
