"use client";

import { formatCurrency } from "@/lib/utils";
import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import {
  CancelCircleIcon,
  ChartAverageIcon,
  CheckmarkCircle02Icon,
  ClipboardListIcon,
  Clock01Icon,
  Coins01Icon,
  TaskDone01Icon,
  Timer01Icon,
} from "@hugeicons/core-free-icons";

import { useMemo } from "react";
import { DEFAULT_DICS, matchEngineerStatus, matchWoStatus } from "./EngineerTaskTable";

const MIN_COMPLETED_WO_PER_ENG = 15;

export const EngineerMonitoringStats = ({
  summary = {},
  tasks = [],
  completedTasks = [],
  internalEngineers = [],
  vendorEngineers = [],
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

    // Filter completed tasks by active DICs (valid completed tasks across all clusters)
    const validCompletedTasks = completedTasks.filter((t) => {
      const eng = String(t.engineer || "")
        .trim()
        .toLowerCase();
      if (!eng || eng === "unassigned" || eng === "—" || eng === "-") return false;

      // DIC filter
      if (selectedDics.length > 0) {
        const rowDic = getDepartmentCategory(t.department || t.department_in_charge);
        if (!selectedDics.includes(rowDic)) return false;
      } else {
        return false;
      }
      return true;
    });

    // Clean alphanumeric token helper for reliable engineer name matching
    const cleanToken = (str) =>
      String(str || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    // Index internal and vendor engineers from listEngineering
    const internalTokenMap = new Map();
    const vendorTokens = new Set();

    internalEngineers.forEach((eng) => {
      [eng.username, eng.fullname, eng.name].forEach((val) => {
        const token = cleanToken(val);
        if (token && token.length >= 2) {
          internalTokenMap.set(token, eng);
        }
      });
    });

    vendorEngineers.forEach((eng) => {
      [eng.username, eng.fullname, eng.name].forEach((val) => {
        const token = cleanToken(val);
        if (token && token.length >= 2) {
          vendorTokens.add(token);
        }
      });
    });

    const findInternalEngineer = (
      engName,
      engUsername = "",
      engType = "",
      completedUser = "",
      currentEngineerName = "",
    ) => {
      const upper = String(engName || "")
        .trim()
        .toUpperCase();
      const type = String(engType || "")
        .trim()
        .toLowerCase();
      const cUser = String(completedUser || "")
        .trim()
        .toUpperCase();
      const uName = String(engUsername || "")
        .trim()
        .toUpperCase();
      const currName = String(currentEngineerName || "")
        .trim()
        .toUpperCase();

      if (!upper || upper === "UNASSIGNED" || upper === "—" || upper === "-" || upper === "NULL") {
        return null;
      }

      // Explicit vendor checks from type, name, or keywords
      if (
        type === "vendor_engineer" ||
        type.includes("vendor") ||
        upper.includes("VENDOR") ||
        upper.startsWith("VND ") ||
        upper.startsWith("V-") ||
        cUser.includes("VENDOR") ||
        uName.includes("VENDOR") ||
        currName.includes("VENDOR")
      ) {
        return null;
      }

      const candidateTokens = [
        cleanToken(upper),
        cleanToken(uName),
        cleanToken(currName),
        cleanToken(cUser),
      ].filter((t) => t && t.length >= 2);

      // Check if matches known vendor token
      for (const tToken of candidateTokens) {
        if (vendorTokens.has(tToken)) return null;
      }

      // Check matches against internal engineers
      if (internalTokenMap.size > 0) {
        for (const tToken of candidateTokens) {
          // Exact token match
          if (internalTokenMap.has(tToken)) {
            return internalTokenMap.get(tToken);
          }
          // Substring / prefix match for tokens with sufficient length
          for (const [iToken, eng] of internalTokenMap.entries()) {
            if (
              (tToken.length >= 4 && iToken.startsWith(tToken)) ||
              (iToken.length >= 4 && tToken.startsWith(iToken)) ||
              (tToken.length >= 4 && iToken.includes(tToken))
            ) {
              return eng;
            }
          }
        }
      }

      // Fallback: If listEngineering is empty or unavailable, treat non-vendor as internal
      if (internalEngineers.length === 0) {
        return {
          id: cleanToken(upper),
          name: engName,
          fullname: engName,
          username: engUsername || engName,
          user_type: "engineer",
        };
      }

      return null;
    };

    // Map overall completed tasks per internal engineer across ALL clusters
    const overallInternalMap = new Map();
    validCompletedTasks.forEach((t) => {
      const matched = findInternalEngineer(
        t.engineer,
        t.engineer_username,
        t.engineer_type,
        t.completedUser,
        t.currentEngineerName,
      );
      if (!matched) return;

      const key = String(matched.id || matched.username || matched.fullname || matched.name);
      if (!overallInternalMap.has(key)) {
        overallInternalMap.set(key, {
          eng: matched,
          totalCompletedWo: 0,
        });
      }
      overallInternalMap.get(key).totalCompletedWo += 1;
    });

    // Filter completed tasks by selected clusters (for current view)
    const targetCompletedTasks = validCompletedTasks.filter((t) => {
      if (selectedClusters.length > 0) {
        const c = String(t.cluster || t.cluster_name || "").trim();
        if (!selectedClusters.includes(c)) return false;
      }
      return true;
    });

    // 1. Total CTO Keseluruhan: sum of all CTO price across all valid completed tasks in target view
    const totalCtoKeseluruhan = targetCompletedTasks.reduce((acc, t) => {
      const price = Number(t.ctoPrice || 0);
      return acc + (isNaN(price) ? 0 : price);
    }, 0);

    // 2. Group target completed tasks by internal engineer
    const targetInternalMap = new Map();

    targetCompletedTasks.forEach((t) => {
      const matched = findInternalEngineer(
        t.engineer,
        t.engineer_username,
        t.engineer_type,
        t.completedUser,
        t.currentEngineerName,
      );
      if (!matched) return;

      const key = String(matched.id || matched.username || matched.fullname || matched.name);
      if (!targetInternalMap.has(key)) {
        targetInternalMap.set(key, {
          key,
          name: matched.fullname || matched.name || matched.username || t.engineer,
          completedWo: 0,
          totalCto: 0,
          overallCompletedWo: overallInternalMap.get(key)?.totalCompletedWo || 0,
        });
      }

      const stat = targetInternalMap.get(key);
      stat.completedWo += 1;
      const price = Number(t.ctoPrice || 0);
      stat.totalCto += isNaN(price) ? 0 : price;
    });

    const internalEngList = Array.from(targetInternalMap.values());
    const totalInternalEngCount = internalEngList.length;

    let totalAverageTaskCompleted = 0;
    let totalAverageCto = 0;

    if (totalInternalEngCount > 0) {
      const sumCompletedWo = internalEngList.reduce((acc, eng) => acc + eng.completedWo, 0);
      const sumCto = internalEngList.reduce((acc, eng) => acc + eng.totalCto, 0);

      // Cara C: Rata-rata per engineer internal (hanya user_type: "engineer")
      totalAverageTaskCompleted = sumCompletedWo / totalInternalEngCount;
      totalAverageCto = sumCto / totalInternalEngCount;
    }

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
        totalCtoKeseluruhan,
        totalAverageCto,
        totalAverageTaskCompleted,
        totalInternalEngCount,
      };
    }

    return {
      total,
      uncompleted,
      preCompleted,
      pending,
      rejected,
      completed,
      totalCtoKeseluruhan,
      totalAverageCto,
      totalAverageTaskCompleted,
      totalInternalEngCount,
    };
  }, [
    summary,
    tasks,
    completedTasks,
    internalEngineers,
    vendorEngineers,
    selectedClusters,
    selectedDics,
    selectedEngStatuses,
    selectedWoStatuses,
  ]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      <StatsCard
        label="Total Tasks"
        value={stats.total}
        helperText="All assigned engineering tasks"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Uncompleted"
        value={stats.uncompleted}
        helperText="Tasks not yet completed"
        icon={Clock01Icon}
      />
      <StatsCard
        label="Pre-Completed"
        value={stats.preCompleted}
        helperText="Tasks awaiting final completion"
        icon={TaskDone01Icon}
      />
      <StatsCard
        label="Pending"
        value={stats.pending}
        helperText="Tasks awaiting further action"
        icon={Timer01Icon}
      />
      <StatsCard
        label="Rejected"
        value={stats.rejected}
        helperText="Tasks rejected by admin"
        icon={CancelCircleIcon}
      />
      <StatsCard
        label="Completed"
        value={stats.completed}
        helperText="Successfully completed tasks"
        icon={CheckmarkCircle02Icon}
      />
      <StatsCard
        label="Total Average CTO"
        value={formatCurrency(Math.round(stats.totalAverageCto))}
        helperText={
          stats.totalInternalEngCount > 0
            ? `Rata-rata CTO per engineer (${stats.totalInternalEngCount} engineer internal)`
            : "Belum ada task completed engineer internal"
        }
        icon={ChartAverageIcon}
      />
      <StatsCard
        label="Total Average Task Completed"
        value={
          stats.totalInternalEngCount > 0
            ? `${Number(stats.totalAverageTaskCompleted.toFixed(1)).toLocaleString("id-ID")} WO`
            : 0
        }
        helperText={
          stats.totalInternalEngCount > 0
            ? `Rata-rata task per engineer (${stats.totalInternalEngCount} engineer internal)`
            : "Belum ada task completed engineer internal"
        }
        icon={ChartAverageIcon}
      />
      <StatsCard
        label="Total CTO Keseluruhan"
        value={formatCurrency(stats.totalCtoKeseluruhan)}
        helperText="Total akumulasi nominal CTO"
        icon={Coins01Icon}
      />
    </div>
  );
};

export default EngineerMonitoringStats;
