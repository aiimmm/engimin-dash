"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { generateCreatedTodayReport } from "@/modules/created-dates/lib";
import { CheckCheckIcon, Copy01Icon, SchoolReportCardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

export const CreatedDatesPreviewReports = ({
  rows = [],
  selectedClusters = [],
  dateRange = {},
}) => {
  const [copied, setCopied] = useState(false);

  const clusterFilteredRows = useMemo(() => {
    if (!selectedClusters.length) return rows;
    return rows.filter((row) => selectedClusters.includes(row.cluster));
  }, [rows, selectedClusters]);

  const reportText = useMemo(() => {
    return generateCreatedTodayReport(clusterFilteredRows, {
      selectedClusters,
      date: dateRange?.from,
    });
  }, [clusterFilteredRows, selectedClusters, dateRange]);

  const clusterLabel = useMemo(() => {
    if (!selectedClusters.length) return "All Clusters";
    return selectedClusters.join(", ");
  }, [selectedClusters]);

  const previewLines = useMemo(() => (reportText ? reportText.split("\n") : []), [reportText]);

  const handleCopy = async () => {
    if (!reportText) {
      toast.add({ type: "warning", title: "There is no report content to copy." });
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
      toast.add({
        type: "success",
        title: `Report berhasil disalin ke clipboard`,
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
          Preview Today&apos;s Created Report
        </CardTitle>
        <CardDescription>
          Pratinjau report work order yang dibuat berdasarkan cluster dan rentang tanggal yang
          dipilih.
        </CardDescription>
      </div>
      <Card>
        <CardContent className="font-mono text-xs text-foreground">
          <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
            {previewLines.map((line, idx) => {
              if (line.includes("*")) {
                const parts = line.split(/(\*[^*]+\*)/g);
                return (
                  <span key={idx} className="block">
                    {parts.map((part, pIdx) => {
                      if (part.startsWith("*") && part.endsWith("*")) {
                        return (
                          <strong key={pIdx} className="font-bold text-foreground">
                            {part.slice(1, -1)}
                          </strong>
                        );
                      }
                      return <span key={pIdx}>{part}</span>;
                    })}
                  </span>
                );
              }
              return (
                <span key={idx} className="block">
                  {line || "\u00A0"}
                </span>
              );
            })}
          </pre>
        </CardContent>
      </Card>
      <CardFooter className="px-0">
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

export const CreatedTodayPreviewReports = CreatedDatesPreviewReports;
