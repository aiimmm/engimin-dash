"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateAllocationReport } from "@/modules/allocation/lib/reports";
import { CheckIcon, CopyIcon, FileTextIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const AllocationPreviewReports = ({
  data = [],
  title = "Engineering Schedules",
  tabName = "Engineer Internal",
  date = "",
  selectedClusters = [],
}) => {
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    return generateAllocationReport(data, { date, selectedClusters });
  }, [data, date, selectedClusters]);

  const handleCopy = async () => {
    if (!reportText) {
      toast.warning("Tidak ada konten laporan untuk disalin.");
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
      toast.success(`Laporan jadwal (${tabName}) berhasil disalin ke clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying report:", error);
      toast.error("Gagal menyalin laporan ke clipboard.");
    }
  };

  const lines = useMemo(() => reportText.split("\n"), [reportText]);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="size-5 text-muted-foreground" />
              Preview WhatsApp Schedule ({tabName})
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {data.length} Task
            </Badge>
          </div>
          <CardDescription>
            Format teks WhatsApp terkelompok berdasarkan nama engineer sesuai jadwal alokasi.
          </CardDescription>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? (
              <CheckIcon className="size-4 text-emerald-600" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            {copied ? "Copied" : "Copy Schedule"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg border bg-muted/40 p-4 font-mono text-xs sm:text-sm text-foreground">
          <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">
            {lines.map((line, idx) => {
              if (line.startsWith("Engineering Schedules")) {
                return (
                  <span key={idx} className="font-bold text-base text-primary block mb-2">
                    {line}
                  </span>
                );
              }
              if (line.includes(" | ") && line.includes("row(s)")) {
                return (
                  <span key={idx} className="font-bold text-foreground block mt-3 text-sm">
                    {line}
                  </span>
                );
              }
              if (line.startsWith("Note:")) {
                return (
                  <span key={idx} className="text-muted-foreground block mb-2">
                    {line}
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
        </div>
      </CardContent>
    </Card>
  );
};
