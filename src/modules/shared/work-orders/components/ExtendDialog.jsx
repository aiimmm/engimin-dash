"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { CalendarPlusIcon, LoaderCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalise berbagai format date menjadi "YYYY-MM-DD", atau "" jika gagal */
function toIso(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{8}$/.test(str)) return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

/** Tambah N hari ke ISO date string */
function addDays(isoStr, n) {
  if (!isoStr) return "";
  const m = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + n);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Format ISO date ke tampilan dd/mm/yyyy */
function fmt(isoStr) {
  if (!isoStr) return null;
  const m = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExtendDialog({ open, onOpenChange, targetRows = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("-");

  // Hitung H+3 CO per-WO secara otomatis
  const woExtendList = useMemo(
    () =>
      targetRows.map((row) => {
        const res = row.activeReservation || row.latestReservation;
        const coIso = toIso(res?.checkoutDate || row.coDate || "");
        const extendTo = addDays(coIso, 3);
        return { row, coIso, extendTo, canExtend: Boolean(extendTo) };
      }),
    [targetRows],
  );

  const skippedCount = woExtendList.filter((x) => !x.canExtend).length;
  const eligibleList = woExtendList.filter((x) => x.canExtend);

  const handleConfirmExtend = async () => {
    if (!eligibleList.length) {
      toast.add({
        type: "warning",
        title: "Tidak ada WO yang bisa di-extend (semua tanggal CO kosong).",
      });
      return;
    }

    setLoading(true);

    // Kirim request per-WO secara parallel — hanya yang punya CO date valid
    const results = await Promise.allSettled(
      eligibleList.map(({ row, coIso, extendTo }) => {
        const code = String(row.roomCode || "").trim();
        const woId = Number(row.id || row.workOrderId);
        if (!code || !woId) return Promise.reject(new Error("Data WO tidak valid"));
        return apiClient.post("/workorders/extend", {
          codes: [code],
          listWo: [woId],
          start: coIso,
          end: extendTo,
          notes: notes || "-",
        });
      }),
    );

    setLoading(false);

    const succeeded = results.filter((r) => r.status === "fulfilled" && r.value?.data?.success);
    const failed = results.filter((r) => r.status === "rejected" || !r.value?.data?.success);

    if (succeeded.length > 0 && failed.length === 0) {
      const skipNote = skippedCount > 0 ? `, ${skippedCount} dilewati (CO kosong)` : "";
      toast.add({
        type: "success",
        title: `${succeeded.length} WO berhasil di-extend (H+3 CO)${skipNote}.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } else if (succeeded.length > 0 && failed.length > 0) {
      toast.add({
        type: "warning",
        title: `${succeeded.length} berhasil, ${failed.length} gagal di-extend.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } else {
      const firstErr =
        failed[0]?.reason?.response?.data?.message ||
        failed[0]?.value?.data?.message ||
        "Gagal melakukan extend work order.";
      toast.add({ type: "error", title: firstErr });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlusIcon className="size-5 text-primary" />
            Perpanjang Work Order (H+3 CO)
          </DialogTitle>
          <DialogDescription>
            Setiap WO akan di-extend otomatis ke <strong>H+3 tanggal CO</strong>-nya masing-masing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {skippedCount > 0 && (
            <span className="block text-xs text-yellow-600 dark:text-yellow-400">
              {skippedCount} WO tidak memiliki tanggal CO dan akan dilewati.
            </span>
          )}
          {/* Tabel daftar WO */}
          <div className="rounded-xl border overflow-hidden text-xs">
            {/* Header kolom */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 bg-muted/60 border-b text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>No. WO</span>
              <span>CO Date</span>
              <span>Extend (H+3)</span>
            </div>

            {/* Baris per WO */}
            <div className="max-h-52 overflow-y-auto divide-y">
              {woExtendList.map(({ row, coIso, extendTo, canExtend }) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-2 transition-colors ${
                    canExtend
                      ? "hover:bg-muted/30"
                      : "bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-400/20 dark:text-yellow-400"
                  }`}
                >
                  {/* WO Number */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-semibold font-mono truncate ${
                        canExtend ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {row.woNumber}
                    </span>
                  </div>

                  {/* CO Date */}
                  <span
                    className={`tabular-nums ${canExtend ? "text-muted-foreground" : "text-yellow-600 dark:text-yellow-400"}`}
                  >
                    {fmt(coIso) ?? <span className="italic mr-3.5">Tidak ada</span>}
                  </span>

                  {/* Extend Date */}
                  {canExtend ? (
                    <span className="tabular-nums font-semibold text-foreground">
                      {fmt(extendTo)}
                    </span>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-400/20 dark:text-yellow-400 py-0"
                    >
                      Dilewati
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Footer ringkas */}
            <div className="px-3 py-1.5 bg-muted/40 border-t text-[10px] text-muted-foreground flex items-center justify-between">
              <span>
                {eligibleList.length} akan di-extend
                {skippedCount > 0 && (
                  <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                    · {skippedCount} dilewati
                  </span>
                )}
              </span>
              <span className="font-medium text-primary">H+3 CO otomatis</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold">Catatan / Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirmExtend} disabled={loading || eligibleList.length === 0}>
            {loading ? (
              <>
                <LoaderCircleIcon className="mr-1 size-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <CalendarPlusIcon className="mr-1 size-4" />
                Extend
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
