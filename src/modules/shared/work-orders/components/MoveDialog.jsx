"use client";

import { Typography } from "@/components/elements/Typography";
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
import { formatCompactDate } from "@/modules/appointment/lib";
import { today } from "@/modules/shared/work-orders/lib";
import { ArrowRightLeftIcon, LoaderCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";

export function MoveDialog({ open, onOpenChange, targetRows = [], onSuccess }) {
  const [loading, setLoading] = useState(false);

  const getIsoFromVal = (val) => {
    if (!val) return "";
    const str = String(val).trim();
    if (/^\d{8}$/.test(str)) {
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    }
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
  };

  const addOneDayToIso = (isoStr) => {
    if (!isoStr) return "";
    const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return "";
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const moveItems = useMemo(() => {
    return targetRows.map((row) => {
      const currentRes = row.activeReservation || row.latestReservation;
      const coDateRaw = currentRes?.checkoutDate || row.coDate || "";
      const baseStart = getIsoFromVal(coDateRaw) || today();
      const hPlusOneDate = addOneDayToIso(baseStart) || today();
      const actionDateWithTime = `${hPlusOneDate} 00:00:00`;

      return {
        row,
        payloadItem: {
          roomid: Number(row.foRoomsId),
          roomnumber: String(row.oldRoomName || row.roomName || ""),
          guestname: "",
          workorders_id: Number(row.id),
          action_date: actionDateWithTime,
          id: Number(row.tracingId || row.id),
          is_wo_priority: "0",
          is_guestAppointment: "no",
        },
        hPlusOneDate,
      };
    });
  }, [targetRows]);

  const handleConfirmMove = async () => {
    if (!moveItems.length) {
      toast.add({ type: "warning", title: "No work orders selected for moving action date." });
      return;
    }

    setLoading(true);
    try {
      const payloadItems = moveItems.map((item) => item.payloadItem);
      const response = await apiClient.post("/workorders/move", { items: payloadItems });

      if (response.data?.success) {
        toast.add({
          type: "success",
          title: `Successfully moved action date for ${payloadItems.length} work order(s)!`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.add({
          type: "error",
          title: response.data?.message || "Failed to move action date.",
        });
      }
    } catch (error) {
      console.error("Move WO error:", error);
      toast.add({
        type: "error",
        title: error?.response?.data?.message || "Failed to move action date.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeftIcon className="size-5 text-primary" />
            Move Action Date (H+1 CO)
          </DialogTitle>
          <DialogDescription>
            Move tanggal tindakan untuk {targetRows.length} work order yang dipilih ke H+1 setelah
            checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Typography as="label" className="text-xs font-semibold text-muted-foreground">
            Target Work Order ({moveItems.length})
          </Typography>
          <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-2">
            {moveItems.map(({ row, hPlusOneDate }) => (
              <div key={row.id} className="rounded-md border bg-background p-2 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-primary">{row.woNumber}</span>
                  <span className="text-muted-foreground">{row.towerName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Unit: {row.roomName || "—"}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Action Date Baru: {formatCompactDate(hPlusOneDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirmMove} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> Sedang Memindahkan...
              </>
            ) : (
              <>
                <ArrowRightLeftIcon className="mr-1.5 size-4" /> Simpan Perubahan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
