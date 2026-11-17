"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { DataTable } from "@/modules/shared/work-orders";
import { compareRiClusters, today } from "@/modules/shared/work-orders/lib";
import {
  BadgeXIcon,
  CheckCheckIcon,
  Copy01Icon,
  SchoolReportCardIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EngineerRejectedScheduleColumns,
  extractAdminCompletedNote,
  getTaskWoNumber,
} from "./EngineerRejectedScheduleColumns";

export { EngineerRejectedScheduleColumns, extractAdminCompletedNote, getTaskWoNumber };

// Helper: normalize any date format (YYYY-MM-DD, DD/MM/YYYY, ISO) to YYYY-MM-DD
function parseDateOnlyToIso(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const datePart = s.split(/[ T]/)[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  const dmy = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return datePart;
}

// ============================================================================
// HELPER: Check if a work order / task has an engineer schedule rejected
// Note: Exactly synchronized with EngineerMonitoringStats and Travelio API
// Only accepts status "Rejected" and explicitly excludes "Rejected WO Guarantee"
// ============================================================================
export function isEngineerScheduleRejected(task = {}) {
  if (!task) return false;

  const engStatus = String(
    task.engineer_status ||
      task.engineerStatus ||
      task.traces_status ||
      task.reservationtraces_status ||
      task.reservationtrace_status ||
      "",
  )
    .toLowerCase()
    .trim();

  const woStatus = String(task.status || task.wo_status || task.woStatus || "")
    .toLowerCase()
    .trim();

  // Explicitly exclude "Rejected WO Guarantee"
  if (
    engStatus.includes("guarantee") ||
    woStatus.includes("guarantee") ||
    /rejected\s+wo\s+guarantee/i.test(engStatus) ||
    /rejected\s+wo\s+guarantee/i.test(woStatus) ||
    (task.rejected_wo_guarantee_date &&
      task.rejected_wo_guarantee_date !== "—" &&
      task.rejected_wo_guarantee_date !== "-")
  ) {
    return false;
  }

  // Only include standard "Rejected" status
  return (
    engStatus === "rejected" || (engStatus.includes("reject") && !engStatus.includes("guarantee"))
  );
}

// ============================================================================
// HELPER: Extract rejection status, date, and admin from task or detail history
// Supports both currently rejected tasks and tasks with rejection logs in detail
// ============================================================================
export function getTaskRejectInfo(task = {}) {
  if (!task) return { isRejected: false };

  // Explicitly exclude "Rejected WO Guarantee"
  const engStatus = String(
    task.engineer_status ||
      task.engineerStatus ||
      task.traces_status ||
      task.reservationtraces_status ||
      task.reservationtrace_status ||
      "",
  ).toLowerCase();
  const woStatus = String(task.status || task.wo_status || task.woStatus || "").toLowerCase();

  if (
    engStatus.includes("guarantee") ||
    woStatus.includes("guarantee") ||
    /rejected\s+wo\s+guarantee/i.test(engStatus) ||
    /rejected\s+wo\s+guarantee/i.test(woStatus) ||
    (task.rejected_wo_guarantee_date &&
      task.rejected_wo_guarantee_date !== "—" &&
      task.rejected_wo_guarantee_date !== "-")
  ) {
    return { isRejected: false };
  }

  const isLiveRejected = isEngineerScheduleRejected(task);

  // Check detail history for admin rejection logs
  const detail = Array.isArray(task.detail)
    ? task.detail
    : Array.isArray(task.details)
      ? task.details
      : [];

  let hasRejectInDetail = false;
  let detailRejectDate = null;
  let detailAdmin = null;

  for (let i = detail.length - 1; i >= 0; i--) {
    const dItem = detail[i];
    const remark = String(dItem.remark || "");
    const hkNotes = String(dItem.housekeeping_notes || "");

    const isRejectLog =
      (/schedule wo .* rejected by/i.test(remark) ||
        /\[remark for wo rejected\]/i.test(remark) ||
        /\[remark for wo rejected\]/i.test(hkNotes)) &&
      !remark.toLowerCase().includes("guarantee");

    if (isRejectLog) {
      hasRejectInDetail = true;
      detailRejectDate = dItem.update_time || dItem.created_date || dItem.updated_date || "";
      const match = remark.match(/rejected by\s+([^.\n\r]+)/i);
      if (match) {
        detailAdmin = match[1].trim();
      }
      break;
    }
  }

  if (!isLiveRejected && !hasRejectInDetail) {
    return { isRejected: false };
  }

  const adminInfo = extractAdminCompletedNote(task);
  const rejectDate = adminInfo.date || detailRejectDate || task.admin_completed_date || "";
  const adminName = adminInfo.admin || detailAdmin || task.admin_completed_user || "Admin";

  return {
    isRejected: true,
    date: rejectDate,
    admin: adminName,
    note: adminInfo.note,
  };
}

// Helper: format unit part: towerName - roomName (without GenID)
function formatTaskUnitOnly(t) {
  const tower = String(t.towerName || t.towername || "").trim();
  const room = String(t.roomName || t.roomname || "").trim();

  if (tower && tower !== "—" && room && room !== "—") {
    return `${tower} - ${room}`;
  }
  if (room && room !== "—") {
    return room;
  }
  if (tower && tower !== "—") {
    return tower;
  }
  return String(t.unit || "—").trim();
}

// Helper: format date to DD/MM/YYYY for title (e.g. 12/11/2026)
function formatReportDateTitle(dateStr) {
  if (!dateStr) {
    const [y, m, d] = today().split("-");
    return `${d}/${m}/${y}`;
  }
  if (dateStr.includes(" s/d ")) {
    const [fromPart, toPart] = dateStr.split(" s/d ");
    return `${formatReportDateTitle(fromPart)} - ${formatReportDateTitle(toPart)}`;
  }
  const ymdMatch = String(dateStr)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d}/${m}/${y}`;
  }
  const dmyMatch = String(dateStr)
    .trim()
    .match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

// ============================================================================
// HELPER: Generate WhatsApp / Telegram formatted text report
// ============================================================================
export function generateRejectedScheduleTextReport(
  tasks = [],
  { date = "", title = "REPORT WO REJECT" } = {},
) {
  if (!tasks || tasks.length === 0) return "";

  const dateLabel = formatReportDateTitle(date || today());
  const separator = "----------------------------------------------------------------------------";

  // Group tasks by cluster
  const clusterMap = new Map();
  tasks.forEach((task) => {
    const cluster = String(task.cluster || task.cluster_name || "Lainnya").trim() || "Lainnya";
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, []);
    }
    clusterMap.get(cluster).push(task);
  });

  const uniqueEngineers = new Set(
    tasks
      .map((t) => String(t.fullname || t.engineer || t.currentEngineerName || "").trim())
      .filter((n) => n && n !== "UNASSIGNED" && n !== "—"),
  );

  const lines = [
    `*${title.toUpperCase()} (${dateLabel})*`,
    `📊 Total Rejected: ${tasks.length} WO | ${uniqueEngineers.size} Engineer | ${clusterMap.size} Cluster`,
    separator,
  ];

  // Sort cluster names from RI 1 up to largest RI number
  const sortedClusterNames = Array.from(clusterMap.keys()).sort(compareRiClusters);

  sortedClusterNames.forEach((clusterName) => {
    const clusterTasks = clusterMap.get(clusterName) || [];
    lines.push("");
    lines.push(`📍 *${clusterName.toUpperCase()} (${clusterTasks.length} WO)*`);

    clusterTasks.forEach((t, idx) => {
      const woNo = getTaskWoNumber(t);
      const unitPart = formatTaskUnitOnly(t);
      const genId = String(t.roomCode || t.roomcode || "").trim();
      const adminInfo = extractAdminCompletedNote(t);
      const cleanReason = (
        (adminInfo.note && adminInfo.note !== "—" ? adminInfo.note : null) ||
        (t.reason && t.reason !== "—" ? t.reason : null) ||
        (t.remark && t.remark !== "—" ? t.remark : null) ||
        (t.note && t.note !== "—" ? t.note : null) ||
        "—"
      ).trim();

      let itemLine = `${idx + 1}. ${unitPart} | ${woNo}`;
      if (genId && genId !== "—" && genId !== "-" && genId.toLowerCase() !== "null") {
        itemLine += ` | (GenID: ${genId})`;
      }
      itemLine += ` >>> "${cleanReason}"`;

      lines.push(itemLine);
    });
  });

  lines.push("");
  lines.push(separator);
  lines.push(
    "Mohon tim Supervisor / Leader untuk segera reassign atau tindak lanjuti WO di atas. 🙏",
  );

  return lines.join("\n");
}

// ============================================================================
// MAIN COMPONENT: EngineerRejectedScheduleReport
// ============================================================================
export default function EngineerRejectedScheduleReport({
  tasks: propTasks,
  isLoading: propIsLoading,
  date = "",
  dateTo = "",
  title = "Report Work Order Rejected Engineer",
  description = "Daftar work order yang ditolak (rejected) oleh team admin completed.",
  selectedClusters = [],
}) {
  // Standalone fetch jika prop tasks tidak diberikan
  const shouldFetch = propTasks === undefined;
  const { data: fetchedData, isLoading: fetchLoading } = useQuery({
    queryKey: ["engineer-rejected-schedule-report", date || today(), dateTo || date || today()],
    queryFn: async () => {
      const targetDate = date || today();
      const targetTo = dateTo || targetDate;
      const res = await apiClient.get("/engineer-monitoring", {
        params: {
          dateFrom: targetDate,
          dateTo: targetTo,
        },
      });
      return res.data?.tasks || [];
    },
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  const isLoading = propIsLoading !== undefined ? propIsLoading : fetchLoading;

  const [copied, setCopied] = useState(false);

  // Filter by selectedClusters (from global header) if active
  const scopedTasks = useMemo(() => {
    const rawTasks = propTasks !== undefined ? propTasks : fetchedData;
    if (!rawTasks || rawTasks.length === 0) return [];
    if (!selectedClusters || selectedClusters.length === 0) return rawTasks;
    return rawTasks.filter((t) => {
      const c = String(t.cluster || t.cluster_name || "").trim();
      return selectedClusters.includes(c);
    });
  }, [propTasks, fetchedData, selectedClusters]);

  // Filter tasks with schedule rejected + tanggal reject admin dalam rentang tanggal
  const rejectedTasks = useMemo(() => {
    if (!scopedTasks || scopedTasks.length === 0) return [];

    const dateFrom = date || today();
    const dateTo_ = dateTo || dateFrom;

    const list = scopedTasks.filter((t) => {
      const rejectInfo = getTaskRejectInfo(t);
      if (!rejectInfo.isRejected) return false;

      const rawRejectDate = rejectInfo.date;
      if (!rawRejectDate) return false;

      const rejectDateOnly = parseDateOnlyToIso(rawRejectDate);
      if (!rejectDateOnly) return false;

      return rejectDateOnly >= dateFrom && rejectDateOnly <= dateTo_;
    });

    return [...list].sort((a, b) => {
      const clusterCompare = compareRiClusters(
        a.cluster || a.cluster_name,
        b.cluster || b.cluster_name,
      );
      if (clusterCompare !== 0) return clusterCompare;
      return getTaskWoNumber(a).localeCompare(getTaskWoNumber(b));
    });
  }, [scopedTasks, date, dateTo]);

  // Unique affected engineers
  const uniqueEngineers = useMemo(() => {
    const set = new Set();
    rejectedTasks.forEach((t) => {
      const name = String(t.fullname || t.engineer || t.currentEngineerName || "").trim();
      if (name && name !== "UNASSIGNED" && name !== "—") set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rejectedTasks]);

  const displayPeriod = useMemo(() => {
    const from = date || today();
    const to = dateTo || from;
    return to !== from ? `${from} s/d ${to}` : from;
  }, [date, dateTo]);

  const previewReportText = useMemo(() => {
    return generateRejectedScheduleTextReport(rejectedTasks, {
      date: displayPeriod,
      title: "REPORT WO REJECT",
    });
  }, [rejectedTasks, displayPeriod]);

  const previewLines = useMemo(() => previewReportText.split("\n"), [previewReportText]);

  // Salin laporan ke clipboard
  const handleCopyReport = async () => {
    if (!previewReportText) {
      toast.add({ type: "warning", title: "Tidak ada data untuk disalin." });
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(previewReportText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = previewReportText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.add({
        type: "success",
        title: `Report berhasil disalin ke clipboard (${rejectedTasks.length} WO)`,
      });
    } catch (err) {
      console.error("[EngineerRejectedScheduleReport] Copy error:", err);
      toast.add({ type: "error", title: "Gagal menyalin report ke clipboard." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Badges */}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <HugeiconsIcon icon={BadgeXIcon} className="size-5" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
        </div>

        {/* Warning Callout jika ada WO schedule rejected */}
        {rejectedTasks.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40">
                <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  {rejectedTasks.length} work order ditolak engineer
                </p>
                <p className="text-xs leading-relaxed text-rose-800/80 dark:text-rose-300/80">
                  Status schedule ditolak oleh <strong>{uniqueEngineers.length} engineer</strong>.
                  Perlu pengecekan reassign penugasan atau konfirmasi ke engineer.
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start rounded-md border border-rose-200/70 bg-white/60 px-2.5 py-1 text-[11px] text-rose-700 sm:self-center dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              Periode: <strong className="font-semibold">{displayPeriod}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="-mt-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : rejectedTasks.length === 0 ? (
          <div className="py-8 text-center border rounded-lg bg-muted/20 border-dashed">
            <UserX className="size-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-foreground">
              Bagus! Tidak ada work order dengan schedule rejected.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Semua penugasan engineer berjalan tanpa adanya status penolakan jadwal.
            </p>
          </div>
        ) : (
          <DataTable
            data={rejectedTasks}
            columns={EngineerRejectedScheduleColumns}
            hideReportAndExport={true}
            showTracingScheduleFilter={false}
            classNameInputGroup="mb-2!"
          />
        )}
      </div>

      {/* Preview Report Section (seperti pada modul lain: Appointment, Created Dates, dll) */}
      {!isLoading && rejectedTasks.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={SchoolReportCardIcon} className="size-5" />
                Preview Report Work Order Rejected Engineer
              </CardTitle>
              <CardDescription>
                Pratinjau laporan work order dengan jadwal yang ditolak (rejected) oleh engineer
                untuk WhatsApp / Telegram.
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
              <Button onClick={handleCopyReport} className="gap-2 w-full">
                {copied ? (
                  <HugeiconsIcon icon={CheckCheckIcon} className="size-4.5" />
                ) : (
                  <HugeiconsIcon icon={Copy01Icon} className="size-4.5" />
                )}
                {copied ? "Tersalin" : "Salin Report"}
              </Button>
            </CardFooter>
          </div>
        </>
      )}
    </div>
  );
}

export { EngineerRejectedScheduleReport };
