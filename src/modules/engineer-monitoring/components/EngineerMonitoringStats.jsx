"use client";

import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  CheckCheckIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  TimerIcon,
  XCircleIcon,
} from "lucide-react";
import { useMemo } from "react";
import { DEFAULT_DICS, matchEngineerStatus, matchWoStatus } from "./EngineerTaskTable";

export const EngineerMonitoringStats = ({
  summary = {},
  tasks = [],
  selectedClusters = [],
  selectedDics = DEFAULT_DICS,
  selectedEngStatuses = [],
  selectedWoStatuses = [],
}) => {
  const stats = useMemo(() => {
    // Filter tasks by selected clusters, DICs, engineer statuses, and WO statuses
    const targetTasks = tasks.filter((t) => {
      // Cluster filter
      if (selectedClusters.length > 0) {
        const c = String(t.cluster || t.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      // DIC filter
      if (selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(t.department || t.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      } else {
        return false;
      }
      // Engineer status filter
      if (selectedEngStatuses.length > 0) {
        if (!matchEngineerStatus(t.engineer_status, selectedEngStatuses)) return false;
      }
      // WO status filter
      if (selectedWoStatuses.length > 0) {
        if (!matchWoStatus(t.status || t.wo_status, selectedWoStatuses)) return false;
      }
      return true;
    });

    let total = targetTasks.length;
    let uncompleted = 0;
    let preCompleted = 0;
    let pending = 0;
    let rejected = 0;
    let completed = 0;

    targetTasks.forEach((t) => {
      const engStatus = String(t.engineer_status || "")
        .toLowerCase()
        .trim();
      const woStatus = String(t.status || t.wo_status || "")
        .toLowerCase()
        .trim();

      // 1. Completed: WO status is already completed
      const isWoCompleted =
        woStatus === "completed" || woStatus === "complete" || woStatus.includes("complete");

      // 2. Pre-Completed: Engineer status is complete / pre-complete, BUT WO status is NOT yet completed
      const isEngineerComplete =
        Number(t.total_pre_completed || 0) > 0 ||
        t.isPreComplete === "1" ||
        t.isPreComplete === 1 ||
        t.isPreComplete === true ||
        t.is_precomplete === 1 ||
        t.is_pre_complete === 1 ||
        engStatus.includes("pre-complete") ||
        engStatus.includes("pre complete") ||
        engStatus.includes("precompleted") ||
        engStatus.includes("pre_complete") ||
        engStatus.includes("pre-completed") ||
        engStatus === "completed" ||
        engStatus === "complete" ||
        engStatus.includes("complete");

      const isPreComplete = isEngineerComplete && !isWoCompleted;

      // 3. Pending & Reject from engineer_status
      const isPending = engStatus.includes("pending");
      const isReject = engStatus.includes("reject");

      if (isWoCompleted) {
        completed += 1;
      } else {
        // Uncompleted tasks: tasks where WO status is not yet completed
        uncompleted += 1;
      }

      if (isPreComplete) {
        preCompleted += 1;
      }
      if (isPending) {
        pending += 1;
      }
      if (isReject) {
        rejected += 1;
      }
    });

    // Use upstream summary metrics directly when default filters are active (no custom filter applied)
    const isDefaultFilters =
      selectedClusters.length === 0 &&
      selectedEngStatuses.length === 0 &&
      selectedWoStatuses.length === 0 &&
      (selectedDics.length === 0 || selectedDics.length >= 8);

    if (
      isDefaultFilters &&
      (summary.total_uncompleted !== undefined || summary.total_task !== undefined)
    ) {
      const uncompleted = Number(summary.total_uncompleted ?? 0);
      const completed = Number(summary.total_completed ?? 0);
      const preCompleted = Number(summary.total_pre_completed ?? 0);
      const rejected = Number(summary.total_rejected ?? 0);
      const pending = Number(summary.total_pending ?? 0);
      const total =
        summary.total_task !== undefined && Number(summary.total_task) > 0
          ? Number(summary.total_task)
          : uncompleted + completed + preCompleted + rejected;

      return {
        total,
        uncompleted,
        preCompleted,
        pending,
        rejected,
        completed,
      };
    }

    return {
      total,
      uncompleted,
      preCompleted,
      pending,
      rejected,
      completed,
    };
  }, [summary, tasks, selectedClusters, selectedDics, selectedEngStatuses, selectedWoStatuses]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      <StatsCard
        label="Total Task"
        value={stats.total}
        helperText="Total Assigned Engineering Tasks"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Uncompleted"
        value={stats.uncompleted}
        helperText="Total Uncompleted Engineering Tasks"
        icon={ClockIcon}
      />
      <StatsCard
        label="Pre-Completed"
        value={stats.preCompleted}
        helperText="Total Done Engineering Tasks"
        icon={CheckCircle2Icon}
      />
      <StatsCard
        label="Pending"
        value={stats.pending}
        helperText="Total Pending Engineering Tasks"
        icon={TimerIcon}
      />
      <StatsCard
        label="Rejected"
        value={stats.rejected}
        helperText="Total Rejected Engineering Tasks"
        icon={XCircleIcon}
      />
      <StatsCard
        label="Completed"
        value={stats.completed}
        helperText="Total Completed Engineering Tasks"
        icon={CheckCheckIcon}
      />
    </div>
  );
};

export default EngineerMonitoringStats;
