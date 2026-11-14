"use client";

import { Typography } from "@/components/elements/Typography";
// ============================================================================
// COMPONENT — /dashboard/settings (Google Sheets Manual Sync Card)
// Purpose: Manual trigger untuk sinkronisasi Required WO ke Google Spreadsheet
// ============================================================================

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { useUserType } from "@/lib/permissions/UserTypeProvider";
import { getIndonesianSheetName } from "@/lib/services/required-wo-sheet";
import { defaultAgingDateRange } from "@/modules/aging/lib";
import { getConflictDateRangeForSync } from "@/modules/appointment/lib";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import {
  AlertCircleIcon,
  Calendar04Icon,
  CheckmarkCircle02Icon,
  ChevronDownIcon,
  FileSpreadsheetIcon,
  GoogleSheetIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isValid, parse } from "date-fns";
import { useMemo, useState } from "react";

// Ambil daftar WO; kalau gagal, kembalikan array kosong supaya sync tetap jalan.
async function fetchRows(label, params) {
  try {
    const res = await apiClient.get("/workorders", { params: { all: 1, ...params } });
    return res.data?.rows || [];
  } catch (err) {
    console.warn(`[ManualSync] Fetch ${label} gagal:`, err);
    return [];
  }
}

const nowLabel = () => new Date().toLocaleTimeString("id-ID");

export function GoogleSheetsSyncCard() {
  const { isFeatureAllowed } = useUserType();
  const canSync = isFeatureAllowed("syncGoogleSheet");

  const [baseDate, setBaseDate] = useState(() => tomorrow());
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const previewSheetName = getIndonesianSheetName(baseDate) || "-";

  const selectedDate = useMemo(() => {
    if (!baseDate) return undefined;
    const parsed = parse(baseDate, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [baseDate]);

  const handleDateSelect = (date) => {
    if (date) setBaseDate(format(date, "yyyy-MM-dd"));
  };

  const handleSyncNow = async () => {
    if (!baseDate) {
      toast.add({ type: "error", title: "Pilih tanggal acuan terlebih dahulu." });
      return;
    }

    setIsSyncing(true);
    try {
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

      const { data } = await apiClient.post("/workorders/required-wo/sync-sheet", {
        date: baseDate,
        appointmentRows,
        conflictRows,
        agingRows,
      });

      if (data?.success || data?.configured === false) {
        const configured = data.configured !== false;
        toast.add(
          configured
            ? {
                type: "success",
                title: `Berhasil sinkron ${data.totalRows} WO ke tab "${data.sheetName}".`,
              }
            : {
                type: "info",
                title: `Data siap (${data.totalRows} WO). Isi REQUIRED_WO_SHEET_WEBHOOK_URL untuk kirim langsung.`,
              },
        );
        setResult({
          ok: true,
          configured,
          sheetName: data.sheetName || previewSheetName,
          totalRows: data.totalRows || 0,
          appointmentCount: data.appointmentCount || 0,
          conflictCount: data.conflictCount || 0,
          agingCount: data.agingCount || 0,
          syncedAt: nowLabel(),
        });
      } else {
        const message = data?.message || "Gagal sinkron ke Google Spreadsheet.";
        toast.add({ type: "error", title: message });
        setResult({ ok: false, error: message, syncedAt: nowLabel() });
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Terjadi kesalahan saat sinkronisasi.";
      console.error("[ManualSync] Google Sheets sync error:", err);
      toast.add({ type: "error", title: message });
      setResult({ ok: false, error: message, syncedAt: nowLabel() });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={GoogleSheetIcon} className="size-5" />
          Google Spreadsheet Sync
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sinkronkan data Required WO ke Google Spreadsheet secara manual. Sinkronisasi otomatis
          sedang dinonaktifkan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mobile: 1 kolom. Tablet ke atas: 2 kolom (tanggal | cakupan data) */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Tanggal acuan */}
          <div className="space-y-2">
            <div className="space-y-3">
              <Label>Tanggal acuan</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-start items-center md:max-w-56"
                    >
                      <HugeiconsIcon icon={Calendar04Icon} data-icon="inline-start" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pilih tanggal"}
                      <HugeiconsIcon icon={ChevronDownIcon} className="ml-auto size-4 opacity-50" />
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
            </div>
            <Typography as="p" className="text-muted-foreground">
              Sinkronisasi ke tab:{" "}
              <span className="font-medium text-foreground">{previewSheetName}</span>
            </Typography>
          </div>

          {/* Cakupan data */}
          <section className="space-y-3">
            <Label>Data yang Disinkronkan</Label>

            <dl className="divide-y overflow-hidden rounded-xl border bg-card text-sm">
              {[
                {
                  label: "Appointment",
                  value: `Jadwal untuk 1 hari ke depan (${baseDate || "-"})`,
                },
                {
                  label: "CI Conflict",
                  value: "Check-in dalam 7 hari ke depan.",
                },
                {
                  label: "Aging WO",
                  value: "Work order yang dibuat dalam 4 hari terakhir hingga kemarin.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-1 gap-1 px-3 py-3 lg:grid-cols-[9rem_1fr] lg:items-baseline lg:gap-4 lg:px-4 xl:grid-cols-[11rem_1fr]"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="min-w-0 wrap-break-word text-foreground text-xs lg:text-right">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Aksi: mobile = tombol di atas lalu status; tablet+ = status kiri, tombol kanan */}
        <div className="flex flex-col gap-4 border-t pt-6 lg:flex-row-reverse lg:items-center lg:justify-between">
          {/* <div className="flex flex-col items-end gap-1.5 self-end lg:self-auto"> */}
          <Button
            onClick={handleSyncNow}
            disabled={!canSync || isSyncing || !baseDate}
            className="gap-2"
          >
            <HugeiconsIcon
              icon={isSyncing ? Refresh01Icon : FileSpreadsheetIcon}
              className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Menyinkronkan..." : "Sinkronkan sekarang"}
          </Button>
          {/* </div> */}

          {/* Status */}
          {!result ? (
            <p className="text-sm text-muted-foreground">
              Belum ada data yang disinkronkan pada sesi ini.
            </p>
          ) : result.ok ? (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                />
                {result.configured
                  ? `Berhasil disinkronkan ke tab "${result.sheetName}" (${result.totalRows} WO)`
                  : `Data siap, webhook belum diatur (${result.totalRows} WO)`}
              </p>
              <p className="text-muted-foreground">
                {result.appointmentCount} Appointment · {result.conflictCount} CI Conflict ·{" "}
                {result.agingCount} Aging · pukul {result.syncedAt}
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
              {result.error} (pukul {result.syncedAt})
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GoogleSheetsSyncCard;
