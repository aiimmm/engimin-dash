"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { generateCreatedTodayReport } from "@/modules/created-dates/lib";
import { CheckIcon, CopyIcon, FileTextIcon } from "lucide-react";
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
        title: `Created today report for ${clusterLabel} copied to clipboard!`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying report:", error);
      toast.add({ type: "error", title: "Failed to copy report to clipboard." });
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-5 text-muted-foreground" />
          <CardTitle>Preview Laporan Created Today</CardTitle>
        </div>
        <CardDescription>
          Pratinjau langsung laporan berdasarkan cluster yang dipilih ({clusterLabel}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border bg-muted/40 p-4 font-mono text-xs sm:text-sm text-foreground">
          <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
            {reportText}
          </pre>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCopy} className="gap-2 w-full">
          {copied ? (
            <CheckIcon className="size-4 text-emerald-600" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          {copied ? "Tersalin" : "Salin Laporan"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const CreatedTodayPreviewReports = CreatedDatesPreviewReports;
