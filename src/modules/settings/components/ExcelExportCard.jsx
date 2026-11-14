"use client";

// ============================================================================
// COMPONENT — /dashboard/settings (Excel Export Card)
// Purpose: Export manual data Work Orders ke file Excel (.xlsx)
// ============================================================================

import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { isBreakContractRow } from "@/lib/services/required-wo-sheet";
import { defaultAgingDateRange } from "@/modules/aging/lib";
import { getConflictDateRangeForSync } from "@/modules/appointment/lib";
import {
  exportGenericWorkOrdersExcel,
  exportRequiredWoExcel,
} from "@/modules/settings/lib/exportExcel";
import {
  defaultConflictRange,
  isExcludedAppointmentDepartment,
  isExcludedConflictArticle,
  today,
  tomorrow,
  yesterday,
} from "@/modules/shared/work-orders/lib";
import {
  Calendar04Icon,
  ChevronDownIcon,
  Download04Icon,
  Loading03Icon,
  Xls02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isValid, parse } from "date-fns";

import { useMemo, useState } from "react";

// `label` = teks singkat di UI, `title` = judul yang dipakai di file Excel.
const MODULE_OPTIONS = [
  {
    id: "REQUIRED_COMBINED",
    label: "Required WO",
    title: "Required WO (Combined: Appointment + CI Conflict + Aging)",
    description:
      "Appointment + CI Conflict + Aging. Format 14 kolom, sama dengan Google Spreadsheet.",
    recommended: true,
  },
  {
    id: "APPOINTMENT",
    label: "Appointment",
    title: "Appointment Dates (Hanya Appointment)",
    description: "Appointment teknisi dengan guest/owner.",
  },
  {
    id: "CONFLICT",
    label: "CI Conflict",
    title: "CI Conflict Work Orders (Hanya Conflict)",
    description: "WO yang berpotensi bentrok dengan jadwal check-in.",
  },
  {
    id: "AGING",
    label: "Aging",
    title: "Aging Work Orders (Hanya Aging)",
    description: "WO tertunda lebih dari 4 hari.",
  },
];

// Hitung default date range per modul single (dipanggil saat user pilih modul baru).
function getDefaultRangeForModule(moduleId) {
  switch (moduleId) {
    case "APPOINTMENT":
      return { from: tomorrow(), to: tomorrow() };
    case "CONFLICT":
      return defaultConflictRange(); // { from: tomorrow, to: today+7 }
    case "AGING":
      return defaultAgingDateRange();
    default:
      return { from: yesterday(), to: today() };
  }
}

// Ambil daftar WO; kalau gagal, kembalikan array kosong supaya export tetap jalan.
async function fetchRows(label, params) {
  try {
    const res = await apiClient.get("/workorders", { params: { all: 1, ...params } });
    return res.data?.rows || [];
  } catch (err) {
    console.warn(`[ExcelExport] Fetch ${label} gagal:`, err);
    return [];
  }
}

export function ExcelExportCard() {
  const [selectedModule, setSelectedModule] = useState("REQUIRED_COMBINED");
  const [baseDate, setBaseDate] = useState(() => tomorrow());
  const [dateRange, setDateRange] = useState(() => getDefaultRangeForModule("APPOINTMENT"));
  const [isExporting, setIsExporting] = useState(false);

  const isCombined = selectedModule === "REQUIRED_COMBINED";
  const canExport = isCombined ? Boolean(baseDate) : Boolean(dateRange?.from && dateRange?.to);

  // Saat ganti modul single, preset date range ke default modul tsb
  const handleSelectModule = (moduleId) => {
    setSelectedModule(moduleId);
    if (moduleId !== "REQUIRED_COMBINED") {
      setDateRange(getDefaultRangeForModule(moduleId));
    }
  };

  const selectedDate = useMemo(() => {
    if (!baseDate) return undefined;
    const parsed = parse(baseDate, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [baseDate]);

  const handleDateSelect = (date) => {
    if (date) setBaseDate(format(date, "yyyy-MM-dd"));
  };

  const exportCombined = async () => {
    const conflictRange = getConflictDateRangeForSync(baseDate);
    const agingRange = defaultAgingDateRange();

    const [appointmentRows, conflictRows, agingRows] = await Promise.all([
      fetchRows("appointment", { dateFrom: baseDate, dateTo: baseDate }),
      fetchRows("conflict", {
        conflict: 1,
        dateFrom: conflictRange.from,
        dateTo: conflictRange.to,
      }),
      fetchRows("aging", { aging: 1, dateFrom: agingRange.from, dateTo: agingRange.to }),
    ]);

    const total = appointmentRows.length + conflictRows.length + agingRows.length;
    if (total === 0) {
      toast.add({
        type: "info",
        title: "Tidak ada data work orders yang ditemukan untuk tanggal ini.",
      });
    }

    exportRequiredWoExcel({
      appointmentRows,
      conflictRows,
      agingRows,
      baseDate,
      filename: `Required_WO_${baseDate}.xlsx`,
    });

    toast.add({
      type: "success",
      title: `File Excel Required WO berhasil diunduh (${total} baris)!`,
    });
  };

  const exportSingle = async () => {
    const params = { all: 1, dateFrom: dateRange.from, dateTo: dateRange.to };
    if (selectedModule === "CONFLICT") params.conflict = 1;
    if (selectedModule === "AGING") params.aging = 1;

    const res = await apiClient.get("/workorders", { params });
    const rawRows = res.data?.rows || res.data?.data || [];

    // Filter: keluarkan break contract dan artikel/departemen yang dikecualikan
    const rows = rawRows.filter((row) => {
      if (isBreakContractRow(row)) return false;
      if (selectedModule === "APPOINTMENT") return !isExcludedAppointmentDepartment(row.department);
      if (selectedModule === "CONFLICT" || selectedModule === "AGING")
        return !isExcludedConflictArticle(row.article);
      return true;
    });

    if (rows.length === 0) {
      toast.add({
        type: "info",
        title: "Tidak ada data work orders pada rentang tanggal yang dipilih.",
      });
    }

    const current = MODULE_OPTIONS.find((m) => m.id === selectedModule);
    const title = current?.title || "Work Orders";

    exportGenericWorkOrdersExcel({
      rows,
      moduleTitle: title,
      filename: `${selectedModule.toLowerCase()}_${dateRange.from}_to_${dateRange.to}.xlsx`,
    });

    toast.add({
      type: "success",
      title: `File Excel ${title} berhasil diunduh (${rows.length} baris)!`,
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (isCombined) await exportCombined();
      else await exportSingle();
    } catch (err) {
      console.error("[ExcelExport] Export error:", err);
      toast.add({
        type: "error",
        title: err?.response?.data?.message || err?.message || "Gagal mengekspor data ke Excel.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={Xls02Icon} className="size-5" />
          Export to Excel (.xlsx)
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Unduh data Work Order dalam format Excel dengan filter aktif dan lebar kolom yang
          disesuaikan secara otomatis.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pilih jenis data */}
        <div className="space-y-3">
          <Label id="module-label">Kategori Data Work Orders</Label>
          <div
            role="radiogroup"
            aria-labelledby="module-label"
            className="grid gap-3 sm:grid-cols-2"
          >
            {MODULE_OPTIONS.map((opt) => {
              const active = selectedModule === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleSelectModule(opt.id)}
                  className={`flex gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-primary" : "border-muted-foreground/50"
                    }`}
                  >
                    {active && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {opt.recommended && <Badge className="text-[11px] h-4">Disarankan</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter tanggal */}
        <div className="space-y-2">
          <div className="space-y-3">
            <Label>{isCombined ? "Tanggal acuan" : "Rentang tanggal"}</Label>
            {isCombined ? (
              <>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-start items-center md:max-w-56 text-xs"
                      >
                        <HugeiconsIcon
                          icon={Calendar04Icon}
                          data-icon="inline-start"
                          className="mr-0.5 size-4"
                        />
                        {selectedDate ? format(selectedDate, "PPP") : "Pilih tanggal"}
                        <HugeiconsIcon
                          icon={ChevronDownIcon}
                          className="ml-auto size-4 opacity-50"
                        />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      defaultMonth={selectedDate}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground mt-1 pb-1">
                  Appointment menggunakan tanggal {baseDate || "-"}, CI Conflict mencakup 7 hari ke
                  depan, dan Aging WO mencakup 4 hari ke belakang hingga kemarin.
                </p>
              </>
            ) : (
              <>
                <div className="w-full md:max-w-56">
                  <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <Typography as="p" className="text-muted-foreground">
                  {selectedModule === "APPOINTMENT" && <>Default otomatis ke besok. </>}
                  {selectedModule === "CONFLICT" && (
                    <>Default otomatis dari besok hingga 7 hari ke depan. </>
                  )}
                  {selectedModule === "AGING" && (
                    <>Default otomatis dari kemarin hingga 4 hari ke belakang. </>
                  )}
                  Rentang aktif: {dateRange?.from} s/d {dateRange?.to}
                </Typography>
              </>
            )}
          </div>
        </div>

        {/* Aksi: mobile = tombol penuh; tablet+ = keterangan kiri, tombol kanan */}
        <div className="flex flex-col gap-4 border-t pt-6 lg:flex-row-reverse lg:items-center lg:justify-between">
          <Button onClick={handleExport} disabled={isExporting || !canExport} className="gap-2">
            <HugeiconsIcon
              icon={isExporting ? Loading03Icon : Download04Icon}
              className={`size-4 ${isExporting ? "animate-spin" : ""}`}
            />
            {isExporting ? "Menyiapkan file..." : "Download Excel"}
          </Button>
          <p className="text-sm text-muted-foreground">
            File Excel akan otomatis diunduh ke browser Anda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExcelExportCard;
