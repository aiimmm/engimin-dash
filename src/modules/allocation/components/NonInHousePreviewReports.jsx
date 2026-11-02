"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import {
  generateNonInHouseKeyPickupReport,
  groupAllocationByEngineer,
} from "@/modules/allocation/lib/reports";
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  SchoolReportCardIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const NonInHousePreviewReports = ({
  data = [],
  tabName = "Engineer Internal",
  dateRange = {},
  selectedClusters = [],
}) => {
  const [copied, setCopied] = useState(false);

  // Group and filter non in-house rows
  const nonInHouseGroups = useMemo(() => {
    const grouped = groupAllocationByEngineer(data);
    return grouped
      .map((group) => {
        const uniqueUnits = new Map();
        group.formattedRows.forEach((r) => {
          if (r.inHouseStatus === "Non In-House") {
            const key = `- ${r.location}`;
            if (!uniqueUnits.has(key)) {
              uniqueUnits.set(key, r);
            }
          }
        });
        return {
          engineerName: group.engineerName,
          units: Array.from(uniqueUnits.values()),
        };
      })
      .filter((g) => g.units.length > 0);
  }, [data]);

  const reportText = useMemo(() => {
    return generateNonInHouseKeyPickupReport(data, {
      dateRange,
      selectedClusters,
    });
  }, [data, dateRange, selectedClusters]);

  const clusterLabel = useMemo(() => {
    if (!selectedClusters.length) return "All Clusters";
    return selectedClusters.join(", ");
  }, [selectedClusters]);

  const handleCopy = async () => {
    if (!reportText) {
      toast.warning("Tidak ada konten report tarik kunci untuk disalin.");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = reportText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(`Report Tarik Kunci (${tabName}) berhasil disalin ke clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying report:", error);
      toast.error("Gagal menyalin report ke clipboard.");
    }
  };

  if (nonInHouseGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={SchoolReportCardIcon} className="size-5" />
          Non In-House Key Retrieval Report
        </CardTitle>
        <CardDescription>
          Daftar unit Non In-House unik berdasarkan engineer untuk kebutuhan penarikan kunci
          operasional.
        </CardDescription>
      </div>

      <Card>
        <CardContent className="font-mono text-xs text-foreground">
          <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
            {reportText}
          </pre>
        </CardContent>
      </Card>

      <CardFooter>
        <Button onClick={handleCopy} className="gap-2 w-full">
          {copied ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} className="size-4" />
          )}
          {copied ? "Tersalin!" : "Salin Report"}
        </Button>
      </CardFooter>
    </div>
  );
};

export default NonInHousePreviewReports;
