"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, toTitleCase } from "@/lib/utils";
import { getDepartmentCategory } from "@/modules/shared/work-orders/lib";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CoinsIcon,
  FlameIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_DICS } from "./EngineerTaskTable";

const MIN_COMPLETED_WO_PER_ENG = 15;

/**
 * Cluster Rankings Card (Top 3 & Bottom 3 for Average Task & Average CTO)
 * With expandable engineer breakdowns per cluster.
 */
export const ClusterAverageRankings = ({
  completedTasks = [],
  query,
  selectedDics = DEFAULT_DICS,
}) => {
  // Store expanded cluster IDs/keys
  const [expandedClusters, setExpandedClusters] = useState({});

  const toggleClusterExpand = (clusterKey) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterKey]: !prev[clusterKey],
    }));
  };

  const clusterMetrics = useMemo(() => {
    // Filter completed tasks by active DICs (excluding Unassigned, includes ALL clusters unconditionally)
    const validTasks = completedTasks.filter((t) => {
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

    // Group by Cluster -> Engineer
    const clusterMap = new Map();

    validTasks.forEach((t) => {
      const clusterName = String(t.cluster || "").trim() || "Unassigned Cluster";
      const engName = String(t.engineer || "").trim();
      const cto = Number(t.ctoPrice || 0);

      if (!clusterMap.has(clusterName)) {
        clusterMap.set(clusterName, new Map());
      }
      const engMap = clusterMap.get(clusterName);

      if (!engMap.has(engName)) {
        engMap.set(engName, { name: engName, completedWo: 0, totalCto: 0 });
      }
      const engStat = engMap.get(engName);
      engStat.completedWo += 1;
      engStat.totalCto += isNaN(cto) ? 0 : cto;
    });

    // Calculate cluster averages and sort engineer breakdowns
    const results = [];

    clusterMap.forEach((engMap, clusterName) => {
      const totalEngineers = engMap.size;
      let totalCompletedWo = 0;
      let totalCto = 0;
      let qualifiedEngineersCount = 0;

      const engineers = Array.from(engMap.values()).map((eng) => {
        totalCompletedWo += eng.completedWo;
        totalCto += eng.totalCto;
        if (eng.completedWo >= MIN_COMPLETED_WO_PER_ENG) {
          qualifiedEngineersCount += 1;
        }
        return eng;
      });

      // Sort engineers descending by completed WO, then CTO
      engineers.sort((a, b) => {
        if (b.completedWo !== a.completedWo) return b.completedWo - a.completedWo;
        return b.totalCto - a.totalCto;
      });

      const avgTask = totalEngineers > 0 ? totalCompletedWo / totalEngineers : 0;
      const avgCto = totalEngineers > 0 ? totalCto / totalEngineers : 0;

      results.push({
        clusterName,
        totalEngineers,
        totalCompletedWo,
        totalCto,
        avgTask,
        avgCto,
        qualifiedEngineersCount,
        engineers,
      });
    });

    // Calculate Rankings
    // Filter for Avg Task Rankings: qualified cluster with at least 1 engineer having >= 15 completed WO
    const taskEligibleClusters = results.filter((c) => c.qualifiedEngineersCount > 0);
    const taskClustersToRank = taskEligibleClusters.length > 0 ? taskEligibleClusters : results;

    // Sort for Avg Task
    const sortedByTaskAsc = [...taskClustersToRank].sort((a, b) => a.avgTask - b.avgTask);
    const sortedByTaskDesc = [...taskClustersToRank].sort((a, b) => b.avgTask - a.avgTask);

    const bottom3Task = sortedByTaskAsc.slice(0, 3);
    const top3Task = sortedByTaskDesc.slice(0, 3);

    // Sort for Avg CTO
    const sortedByCtoAsc = [...results].sort((a, b) => a.avgCto - b.avgCto);
    const sortedByCtoDesc = [...results].sort((a, b) => b.avgCto - a.avgCto);

    const bottom3Cto = sortedByCtoAsc.slice(0, 3);
    const top3Cto = sortedByCtoDesc.slice(0, 3);

    return {
      totalClusters: results.length,
      hasTaskThresholdMatch: taskEligibleClusters.length > 0,
      bottom3Task,
      top3Task,
      bottom3Cto,
      top3Cto,
    };
  }, [completedTasks, selectedDics]);

  const renderClusterItem = ({ cluster, index, type, badgeColor }) => {
    const clusterKey = `${type}-${cluster.clusterName}`;
    const isExpanded = !!expandedClusters[clusterKey];

    return (
      <Card key={clusterKey} className="bg-secondary transition-all overflow-hidden">
        <CardContent
          onClick={() => toggleClusterExpand(clusterKey)}
          className="flex items-center justify-between gap-4 cursor-pointer select-none"
        >
          <div className="min-w-0 flex items-center gap-4">
            <Badge
              variant="default"
              className="flex size-10 shrink-0 items-center justify-center font-extrabold text-lg rounded-xl "
            >
              {index + 1}
            </Badge>
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-semibold truncate" title={cluster.clusterName}>
                {toTitleCase(cluster.clusterName)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <UsersIcon className="size-3" />
                {cluster.totalEngineers} Eng • {cluster.totalCompletedWo} Task
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right">
              {type.includes("task") ? (
                <div className={`text-sm font-bold`}>
                  {cluster.avgTask.toFixed(1)}{" "}
                  <span className="text-[10px] font-normal">Task/Eng</span>
                </div>
              ) : (
                <div className={`text-xs font-bold font-mono`}>
                  {formatCurrency(cluster.avgCto)}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle detail teknisi"
            >
              {isExpanded ? (
                <ChevronUpIcon className="size-3.5" />
              ) : (
                <ChevronDownIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </CardContent>

        {/* Expandable Engineer Breakdown */}
        {isExpanded && (
          <div className="px-4 py-4 border-t border-dashed space-y-1.5 animate-in fade-in-50 duration-150">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between pb-1 border-b">
              <span>Engineer ({cluster.engineers.length})</span>
              <span>WO / CTO</span>
            </div>
            {cluster.engineers.map((eng) => (
              <div
                key={eng.name}
                className="flex items-center justify-between text-[11px] py-0.5 hover:bg-muted/60 rounded px-1"
              >
                <span className="truncate max-w-36 font-medium text-foreground flex items-center gap-1">
                  <UserCheckIcon className="size-3 text-muted-foreground shrink-0" />
                  {toTitleCase(eng.name)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1 py-0 h-4.5 ${
                      eng.completedWo >= MIN_COMPLETED_WO_PER_ENG
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {eng.completedWo} WO
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground min-w-16 text-right">
                    {formatCurrency(eng.totalCto)}
                  </span>
                </div>
              </div>
            ))}

            {/* Subtotal Footer */}
            <div className="pt-1.5 mt-1 border-t border-dashed flex items-center justify-between text-[11px] font-semibold">
              <span className="text-muted-foreground flex items-center gap-1">
                <CoinsIcon className="size-3" />
                Subtotal CTO Cluster:
              </span>
              <span className="font-mono">{formatCurrency(cluster.totalCto)}</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <Typography
            as="h3"
            className="font-semibold font-heading text-base flex items-center gap-2"
          >
            <SparklesIcon className="size-4.5 text-primary" />
            Average Cluster Rating (Task & CTO)
          </Typography>
          <Typography as="p" className="text-xs text-muted-foreground mt-1">
            Perhitungan rata-rata task per teknisi (min. {MIN_COMPLETED_WO_PER_ENG} WO completed per
            teknisi) & rata-rata CTO per teknisi di tiap cluster. Klik tiap cluster untuk melihat
            rincian per teknisi.
          </Typography>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {/* 1. 3 Cluster Avg Task Tertinggi */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center text-sm">
              <TrendingUpIcon className="size-5" />3 Cluster Avg Task Tertinggi
            </CardTitle>
            <CardDescription className="text-[11px]">
              Rata-rata task completed engineer terbanyak
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {query?.isLoading ? (
              <div className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : clusterMetrics.top3Task.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Belum ada data cluster
              </div>
            ) : (
              clusterMetrics.top3Task.map((c, idx) =>
                renderClusterItem({
                  cluster: c,
                  index: idx,
                  type: "top-task",
                  badgeColor: "text-emerald-600 dark:text-emerald-400",
                }),
              )
            )}
          </CardContent>
        </Card>

        {/* 2. 3 Cluster Avg Task Terendah */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center text-sm">
              <TrendingDownIcon className="size-5" />3 Cluster Avg Task Terendah
            </CardTitle>
            <CardDescription className="text-[11px]">
              Rata-rata task completed engineer terendah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {query?.isLoading ? (
              <div className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : clusterMetrics.bottom3Task.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Belum ada data cluster
              </div>
            ) : (
              clusterMetrics.bottom3Task.map((c, idx) =>
                renderClusterItem({
                  cluster: c,
                  index: idx,
                  type: "bottom-task",
                  badgeColor: "text-rose-600 dark:text-rose-400",
                }),
              )
            )}
          </CardContent>
        </Card>

        {/* 3. 3 Cluster Avg CTO Tertinggi */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center text-sm">
              <FlameIcon className="size-5" />3 Cluster Avg CTO Tertinggi
            </CardTitle>
            <CardDescription className="text-[11px]">
              Rata-rata akumulasi nominal CTO per engineer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {query?.isLoading ? (
              <div className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : clusterMetrics.top3Cto.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Belum ada data cluster
              </div>
            ) : (
              clusterMetrics.top3Cto.map((c, idx) =>
                renderClusterItem({
                  cluster: c,
                  index: idx,
                  type: "top-cto",
                  badgeColor: "text-amber-600 dark:text-amber-400",
                }),
              )
            )}
          </CardContent>
        </Card>

        {/* 4. 3 Cluster Avg CTO Terendah */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center text-sm">
              <TrendingDownIcon className="size-5" />3 Cluster Avg CTO Terendah
            </CardTitle>
            <CardDescription className="text-[11px]">
              Rata-rata perolehan nominal CTO terendah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {query?.isLoading ? (
              <div className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : clusterMetrics.bottom3Cto.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Belum ada data cluster
              </div>
            ) : (
              clusterMetrics.bottom3Cto.map((c, idx) =>
                renderClusterItem({
                  cluster: c,
                  index: idx,
                  type: "bottom-cto",
                  badgeColor: "text-muted-foreground",
                }),
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClusterAverageRankings;
