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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { today } from "@/modules/shared/work-orders/lib";
import { CalendarPlusIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function ExtendDialog({ open, onOpenChange, targetRows = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("-");

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

  useEffect(() => {
    if (targetRows.length > 0) {
      const firstRow = targetRows[0];
      const currentRes = firstRow.activeReservation || firstRow.latestReservation;
      const coDateRaw = currentRes?.checkoutDate || firstRow.coDate || "";
      const baseStart = getIsoFromVal(coDateRaw) || today();
      const hPlusOneEnd = addOneDayToIso(baseStart) || today();

      // Defer to avoid calling setState synchronously in effect body
      const timeout = setTimeout(() => {
        setStartDate(baseStart);
        setEndDate(hPlusOneEnd);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [targetRows]);

  const handleConfirmExtend = async () => {
    if (!targetRows.length) {
      toast.add({ type: "warning", title: "No work orders selected for extension." });
      return;
    }

    const codes = [
      ...new Set(targetRows.map((r) => String(r.roomCode || "").trim()).filter(Boolean)),
    ];
    const listWo = [
      ...new Set(targetRows.map((r) => Number(r.id || r.workOrderId)).filter(Boolean)),
    ];

    if (!codes.length || !listWo.length) {
      toast.add({ type: "error", title: "Invalid work order or room code data." });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/workorders/extend", {
        codes,
        listWo,
        start: startDate,
        end: endDate,
        notes: notes || "-",
      });

      if (response.data?.success) {
        toast.add({
          type: "success",
          title: `Successfully extended ${listWo.length} work order(s)!`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.add({
          type: "error",
          title: response.data?.message || "Failed to extend work order.",
        });
      }
    } catch (error) {
      console.error("Extend WO error:", error);
      toast.add({
        type: "error",
        title: error?.response?.data?.message || "Failed to extend work order.",
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
            <CalendarPlusIcon className="size-5 text-primary" />
            Perpanjang Work Order (Extend)
          </DialogTitle>
          <DialogDescription>
            Perpanjang durasi untuk {targetRows.length} work order yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Typography as="label" className="text-xs font-semibold text-muted-foreground">
              Target Work Order ({targetRows.length})
            </Typography>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
              {targetRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-primary">{row.woNumber}</span>
                  <span className="text-muted-foreground">Kode: {row.roomCode || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Typography as="label" className="text-xs font-semibold">
              Tanggal Berakhir (Otomatis H+1 CO)
            </Typography>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 text-xs font-mono"
            />
          </div>

          <div>
            <Typography as="label" className="text-xs font-semibold">
              Catatan / Notes
            </Typography>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirmExtend} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> Sedang Menyimpan...
              </>
            ) : (
              <>
                <CalendarPlusIcon className="mr-1.5 size-4" /> Simpan Extend
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
