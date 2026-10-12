"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAgingReport } from "@/modules/aging/lib";
import { CopyReportButton } from "@/modules/shared/work-orders/components/CopyReportButton";
import { useMemo } from "react";

export const AgingPreviewReports = ({
  rows = [],
  selectedClusters = [],
  selectedDics = [],
  dateRange,
}) => {
  const agingReportText = useMemo(() => {
    return generateAgingReport(rows, {
      selectedClusters,
      selectedDics,
      dateRange,
    });
  }, [rows, selectedClusters, selectedDics, dateRange]);

  return (
    <Card className="mt-4">
      <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Preview Laporan Aging</CardTitle>
          <CardDescription>
            Pratinjau teks laporan aging yang siap disalin dan dikirim.
          </CardDescription>
        </div>
        <CopyReportButton reportText={agingReportText} reportLabel="Aging" />
      </CardHeader>
      <CardContent className="pt-4">
        <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
          {agingReportText || "Memuat laporan..."}
        </pre>
      </CardContent>
    </Card>
  );
};

export default AgingPreviewReports;
