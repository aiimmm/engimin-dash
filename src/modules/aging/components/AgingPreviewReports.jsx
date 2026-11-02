"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { generateAgingReport } from "@/modules/aging/lib";
import { CheckCheckIcon, Copy01Icon, SchoolReportCardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

export const AgingPreviewReports = ({
  rows = [],
  selectedClusters = [],
  selectedDics = [],
  dateRange,
}) => {
  const [copied, setCopied] = useState(false);

  const agingReportText = useMemo(() => {
    return generateAgingReport(rows, {
      selectedClusters,
      selectedDics,
      dateRange,
    });
  }, [rows, selectedClusters, selectedDics, dateRange]);

  const handleCopy = async () => {
    if (!agingReportText) {
      toast.add({ type: "warning", title: "There is no report content to copy." });
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(agingReportText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = agingReportText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.add({
        type: "success",
        title: "Report aging berhasil disalin ke clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying report:", error);
      toast.add({ type: "error", title: "Gagal menyalin report ke clipboard." });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={SchoolReportCardIcon} className="size-5" />
          Aging Report Preview
        </CardTitle>
        <CardDescription>
          Pratinjau report aging work order berdasarkan cluster dan rentang tanggal yang dipilih.
        </CardDescription>
      </div>
      <Card>
        <CardContent className="font-mono text-xs text-foreground">
          <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
            {agingReportText || "Memuat laporan..."}
          </pre>
        </CardContent>
      </Card>
      <CardFooter>
        <Button onClick={handleCopy} className="gap-2 w-full">
          {copied ? (
            <HugeiconsIcon icon={CheckCheckIcon} className="size-4.5" />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} className="size-4.5" />
          )}
          {copied ? "Tersalin" : "Salin Report"}
        </Button>
      </CardFooter>
    </div>
  );
};

export default AgingPreviewReports;
