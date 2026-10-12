"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CopyIcon } from "lucide-react";

export function CopyReportButton({ reportText, reportLabel = "Report" }) {
  const handleCopy = async () => {
    if (!reportText) {
      toast.add({ type: "warning", title: "Tidak ada teks laporan untuk disalin." });
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
      toast.add({
        type: "success",
        title: `Laporan ${reportLabel} berhasil disalin ke clipboard!`,
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast.add({ type: "error", title: "Gagal menyalin laporan." });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!reportText}>
      <CopyIcon className="mr-1.5 size-3.5" /> Salin Laporan
    </Button>
  );
}
