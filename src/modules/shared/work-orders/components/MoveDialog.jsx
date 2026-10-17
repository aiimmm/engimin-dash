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
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { ArrowRightLeftIcon, LoaderCircleIcon } from "lucide-react";
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

export function MoveDialog({ open, onOpenChange, targetRows = [], onSuccess }) {
  const [loading, setLoading] = useState(false);

  // Hitung action date baru (H+1 CO) per-WO secara otomatis
  const moveList = useMemo(
    () =>
      targetRows.map((row) => {
        const res = row.activeReservation || row.latestReservation;
        const coIso = toIso(res?.checkoutDate || row.coDate || "");
        const actionDateIso = addDays(coIso, 1); // H+1 CO untuk action date
        const canMove = Boolean(actionDateIso);
        return {
          row,
          coIso,
          actionDateIso,
          canMove,
          payloadItem: canMove
            ? {
                roomid: Number(row.foRoomsId),
                roomnumber: String(row.oldRoomName || row.roomName || ""),
                guestname: "",
                workorders_id: Number(row.id),
                action_date: `${actionDateIso} 00:00:00`,
                id: Number(row.tracingId || row.id),
                is_wo_priority: "0",
                is_guestAppointment: "no",
              }
            : null,
        };
      }),
    [targetRows],
  );

  const skippedCount = moveList.filter((x) => !x.canMove).length;
  const eligibleList = moveList.filter((x) => x.canMove);

  const handleConfirmMove = async () => {
    if (!eligibleList.length) {
      toast.add({
        type: "warning",
        title: "Tidak ada WO yang bisa di-move (semua tanggal CO kosong).",
      });
      return;
    }

    setLoading(true);
    try {
      const payloadItems = eligibleList.map((item) => item.payloadItem);
      const response = await apiClient.post("/workorders/move", { items: payloadItems });

      if (response.data?.success) {
        const skipNote = skippedCount > 0 ? `, ${skippedCount} dilewati (CO kosong)` : "";
        toast.add({
          type: "success",
          title: `${payloadItems.length} WO berhasil di-move action date (H+1 CO)${skipNote}.`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.add({
          type: "error",
          title: response.data?.message || "Gagal memindahkan action date.",
        });
      }
    } catch (error) {
      console.error("Move WO error:", error);
      toast.add({
        type: "error",
        title: error?.response?.data?.message || "Gagal memindahkan action date.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeftIcon className="size-5 text-primary" />
            Move Action Date (H+1 CO)
          </DialogTitle>
          <DialogDescription>
            Action date setiap WO akan dipindah otomatis ke <strong>H+1 tanggal CO</strong>-nya
            masing-masing.
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
              <span>MOVE (H+1)</span>
            </div>

            {/* Baris per WO */}
            <div className="max-h-52 overflow-y-auto divide-y">
              {moveList.map(({ row, coIso, actionDateIso, canMove }) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-2 transition-colors ${
                    canMove
                      ? "hover:bg-muted/30"
                      : "bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-400/20 dark:text-yellow-400"
                  }`}
                >
                  {/* WO Number */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-semibold font-mono truncate ${
                        canMove ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {row.woNumber}
                    </span>
                  </div>

                  {/* CO Date */}
                  <span
                    className={`tabular-nums ${canMove ? "text-muted-foreground" : "text-yellow-600 dark:text-yellow-400"}`}
                  >
                    {fmt(coIso) ?? <span className="italic mr-3.5">Tidak ada</span>}
                  </span>

                  {/* Action Date Baru */}
                  {canMove ? (
                    <span className="tabular-nums font-semibold text-foreground">
                      {fmt(actionDateIso)}
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
                {eligibleList.length} akan di-move
                {skippedCount > 0 && (
                  <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                    · {skippedCount} dilewati
                  </span>
                )}
              </span>
              <span className="font-medium text-primary">H+1 CO otomatis</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirmMove} disabled={loading || eligibleList.length === 0}>
            {loading ? (
              <>
                <LoaderCircleIcon className="mr-1 size-4 animate-spin" /> Memindahkan...
              </>
            ) : (
              <>
                <ArrowRightLeftIcon className="mr-1 size-4" />
                Move
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
