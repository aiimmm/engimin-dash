"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toTitleCase } from "@/lib/utils";
import { RankingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { useEngineerMonitoringData } from "../hooks/useEngineerMonitoringData";

/*
 * DESAIN BARU: "Podium + List"
 *  - Top 3 tampil sebagai podium (susunan 2 – 1 – 3, juara 1 paling tinggi & bermahkota).
 *  - Peringkat 4 dan seterusnya tampil sebagai list ringkas.
 *  - Responsif dengan container queries (Tailwind v4):
 *      Podium : avatar & pedestal mengecil di mobile, membesar di tablet ke atas.
 *      List   : 1 kolom di mobile, 2 kolom di tablet (item terakhir ganjil direntangkan penuh).
 *  - Skeleton meniru bentuk podium + list, jadi tidak ada layout shift saat data masuk.
 */

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Ubah "2026-11-10 01:08:25" -> "10-11-2026 01:08" (tanpa detik).
 * Jika hanya tanggal ("2026-11-10") -> "10-11-2026".
 * Jika format tidak dikenali, coba parse sebagai Date, lalu fallback ke teks asli.
 */
function formatDateTime(value) {
  if (!value) return "";
  const str = String(value).trim();

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return hour ? `${day}-${month}-${year} ${hour}:${minute}` : `${day}-${month}-${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return str;

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

// Warna podium per peringkat (string kelas ditulis utuh agar terdeteksi Tailwind).
const PODIUM_STYLE = {
  1: {
    ring: "ring-amber-500/70",
    pedestal: "bg-linear-to-b from-amber-500/30 to-amber-500/5 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    height: "h-20 @md:h-28",
  },
  2: {
    ring: "ring-slate-400/70",
    pedestal: "bg-linear-to-b from-slate-500/25 to-slate-500/5 border-slate-500/25",
    text: "text-slate-600 dark:text-slate-300",
    height: "h-14 @md:h-20",
  },
  3: {
    ring: "ring-orange-700/60",
    pedestal: "bg-linear-to-b from-orange-700/25 to-orange-700/5 border-orange-700/25",
    text: "text-orange-800 dark:text-orange-400",
    height: "h-10 @md:h-14",
  },
};

// Urutan tampil podium: juara 2, juara 1, juara 3.
const PODIUM_ORDER = { 2: 0, 1: 1, 3: 2 };

const PODIUM_CARD =
  "@container gap-0 overflow-hidden rounded-2xl py-0 bg-linear-to-b from-primary/5 via-card to-card";
const PODIUM_GRID = "grid items-end gap-2 px-3 pt-7 @md:gap-4 @md:px-8 @md:pt-8";
const AVATAR_SIZE = "size-12 @md:size-16";

// List (peringkat 4+). Kelas dipakai bersama oleh baris & skeleton.
const ROW_CARD = "@container relative isolate gap-0 overflow-hidden rounded-2xl py-0";
const ROW_INNER = "flex flex-col gap-2 px-3 py-2.5 @md:px-4";
const ROW_MAIN = "flex items-center gap-2.5 @md:gap-3";
const RANK_SIZE = "size-6 @md:size-7";
const ROW_AVATAR = "size-8 @md:size-9";
const LIST_GRID =
  "grid grid-cols-1 gap-2 @2xl:grid-cols-2 @2xl:[&>li:last-child:nth-child(odd)]:col-span-2";

/* ------------------------------ Podium ------------------------------ */

function PodiumItem({ item, share }) {
  const style = PODIUM_STYLE[item.rank];
  const isFirst = item.rank === 1;

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative">
        {isFirst && (
          <Crown
            className={cn(
              "absolute -top-4 left-1/2 size-4 -translate-x-1/2 fill-amber-500/30 @md:-top-5 @md:size-5",
              style.text,
            )}
          />
        )}
        <div
          className={cn(
            AVATAR_SIZE,
            "flex items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-2 ring-offset-2 ring-offset-card @md:text-base",
            style.ring,
            isFirst && "@md:size-20",
          )}
        >
          {getInitials(item.name)}
        </div>
      </div>

      {/* Nama & total */}
      <p className="mt-2 w-full truncate text-xs font-medium leading-tight @md:text-sm">
        {toTitleCase(item.name)}
      </p>
      <p className="mt-0.5 leading-tight tabular-nums">
        <span className={cn("text-base font-semibold @md:text-lg", style.text)}>
          {item.totalCompleted}
        </span>
        <span className="ml-1 text-[11px] text-muted-foreground">WO</span>
      </p>
      <p className="mb-2 text-[11px] tabular-nums text-muted-foreground">
        {share}%<span className="hidden @md:inline"> dari total</span>
      </p>

      {/* Pedestal */}
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-xl border border-b-0 pt-2",
          style.pedestal,
          style.height,
        )}
      >
        <span className={cn("text-xl font-bold tabular-nums @md:text-3xl", style.text)}>
          {item.rank}
        </span>
      </div>
    </div>
  );
}

function Podium({ items, getShare }) {
  const sorted = [...items].sort((a, b) => PODIUM_ORDER[a.rank] - PODIUM_ORDER[b.rank]);

  return (
    <Card className={PODIUM_CARD}>
      <div
        className={PODIUM_GRID}
        style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))` }}
      >
        {sorted.map((item) => (
          <PodiumItem key={item.name} item={item} share={getShare(item.totalCompleted)} />
        ))}
      </div>
    </Card>
  );
}

function PodiumSkeleton() {
  // Tinggi pedestal mengikuti urutan 2 – 1 – 3
  const heights = [PODIUM_STYLE[2].height, PODIUM_STYLE[1].height, PODIUM_STYLE[3].height];

  return (
    <Card className={PODIUM_CARD}>
      <div className={cn(PODIUM_GRID, "grid-cols-3")}>
        {heights.map((height, idx) => (
          <div key={idx} className="flex min-w-0 flex-col items-center">
            <Skeleton className={cn(AVATAR_SIZE, "rounded-full", idx === 1 && "@md:size-20")} />
            <Skeleton className="mt-2 h-3 w-4/5 max-w-24" />
            <Skeleton className="mt-1.5 h-4 w-10" />
            <Skeleton className="mb-2 mt-1.5 h-3 w-8" />
            <Skeleton className={cn("w-full rounded-b-none rounded-t-xl", height)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ List 4+ ------------------------------ */

function RankRow({ item, maxCompleted, share }) {
  const percentage = Math.round((item.totalCompleted / maxCompleted) * 100);

  return (
    <Card className={cn(ROW_CARD, "transition-all hover:shadow-md")}>
      <div className={ROW_INNER}>
        <div className={ROW_MAIN}>
          <div
            className={cn(
              RANK_SIZE,
              "flex shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground @md:text-xs",
            )}
          >
            {item.rank}
          </div>

          <div
            className={cn(
              ROW_AVATAR,
              "flex shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground @md:text-xs",
            )}
          >
            {getInitials(item.name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{toTitleCase(item.name)}</p>
            {(item.clusterCount > 0 || item.lastCompletedDate) && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground @md:text-xs">
                {item.clusterCount > 0 && <span>{item.clusterCount} cluster</span>}
                {item.clusterCount > 0 && item.lastCompletedDate && <span> · </span>}
                {item.lastCompletedDate && (
                  <span>
                    <span className="hidden @md:inline">Terakhir </span>
                    {formatDateTime(item.lastCompletedDate)}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="leading-tight tabular-nums">
              <span className="text-base font-semibold">{item.totalCompleted}</span>
              <span className="ml-1 text-xs text-muted-foreground">WO</span>
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {share}%<span className="hidden @md:inline"> dari total</span>
            </p>
          </div>
        </div>

        {/* Perbandingan dengan peringkat 1 */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/50 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function RankRowSkeleton() {
  return (
    <Card className={ROW_CARD}>
      <div className={ROW_INNER}>
        <div className={ROW_MAIN}>
          <Skeleton className={cn(RANK_SIZE, "shrink-0 rounded-lg")} />
          <Skeleton className={cn(ROW_AVATAR, "shrink-0 rounded-full")} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/5 max-w-36" />
            <Skeleton className="h-3 w-4/5 max-w-44" />
          </div>
          <div className="shrink-0 space-y-1.5">
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="ml-auto h-3 w-8 @md:w-20" />
          </div>
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat peringkat">
      <PodiumSkeleton />
      <ol className={LIST_GRID}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <li key={idx}>
            <RankRowSkeleton />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------ Main ------------------------------ */

/**
 * TopRankAdminCompletes
 * Leaderboard peringkat admin engineer berdasarkan jumlah WO completed.
 * Dapat langsung di-import di mana saja (dengan atau tanpa props).
 *
 * @param {Array} props.completedTasks - (Opsional) data completed tasks. Jika kosong, otomatis ambil dari hook.
 * @param {boolean} props.isLoading - (Opsional) status loading.
 * @param {string} props.title - Judul card
 * @param {string} props.description - Deskripsi card
 * @param {number} props.limit - Batas jumlah rank yang ditampilkan (opsional)
 * @param {string} props.className - Custom class styling
 */
export function TopRankAdminCompletesView({
  completedTasks = [],
  isLoading = false,
  title = "Top Rank Admin Completed",
  description = "Peringkat admin engineer berdasarkan jumlah work order yang berhasil diselesaikan",
  limit,
  className = "",
}) {
  const [search, setSearch] = useState("");

  // Aggregate total WO completed by completedUser
  const allRankings = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    const map = new Map();

    completedTasks.forEach((task) => {
      const user = String(
        task.completedUser ||
          task.completed_user ||
          task.updatedUser ||
          task.updated_date_user ||
          "",
      ).trim();

      if (!user || user === "—" || user === "-" || user.toLowerCase() === "unassigned") return;

      if (!map.has(user)) {
        map.set(user, {
          name: user,
          totalCompleted: 0,
          clusters: new Set(),
          departments: new Set(),
          lastCompletedDate: null,
        });
      }

      const stat = map.get(user);
      stat.totalCompleted += 1;

      const cluster = String(task.cluster || task.cluster_name || "").trim();
      if (cluster && cluster !== "—") stat.clusters.add(cluster);

      const dept = String(task.department || task.department_in_charge || "").trim();
      if (dept && dept !== "—") stat.departments.add(dept);

      const cDate =
        task.completedDate ||
        task.completed_date ||
        task.updatedDate ||
        task.updated_date ||
        task.actionDate;
      if (cDate && (!stat.lastCompletedDate || cDate > stat.lastCompletedDate)) {
        stat.lastCompletedDate = cDate;
      }
    });

    // Urutkan descending berdasarkan totalCompleted
    const sorted = Array.from(map.values()).sort((a, b) => b.totalCompleted - a.totalCompleted);

    return sorted.map((item, index) => ({
      rank: index + 1,
      name: item.name,
      totalCompleted: item.totalCompleted,
      clusterCount: item.clusters.size,
      departmentList: Array.from(item.departments),
      lastCompletedDate: item.lastCompletedDate,
    }));
  }, [completedTasks]);

  // Filter berdasarkan search keyword
  const filteredRankings = useMemo(() => {
    let result = allRankings;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    return result;
  }, [allRankings, search, limit]);

  const podiumItems = useMemo(
    () => filteredRankings.filter((r) => r.rank <= 3),
    [filteredRankings],
  );
  const restItems = useMemo(() => filteredRankings.filter((r) => r.rank > 3), [filteredRankings]);

  const maxCompleted = allRankings.length > 0 ? allRankings[0].totalCompleted : 1;
  const totalCompletedAll = useMemo(
    () => allRankings.reduce((sum, r) => sum + r.totalCompleted, 0),
    [allRankings],
  );

  const getShare = (value) =>
    totalCompletedAll > 0 ? Math.round((value / totalCompletedAll) * 100) : 0;

  return (
    <div className={cn("@container", className)}>
      <div className="pb-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-1.5 text-sm @md:text-base">
            <HugeiconsIcon icon={RankingIcon} className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{title}</span>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs @md:line-clamp-none">
            {description}
          </CardDescription>
        </div>
      </div>

      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : filteredRankings.length === 0 ? (
          <div className="space-y-2 px-4 py-8 text-center text-muted-foreground @md:py-10">
            <Award className="mx-auto size-8 opacity-40" />
            <p className="text-xs font-medium">
              {search
                ? `Tidak ada admin dengan nama "${search}".`
                : "Belum ada data work orders yang selesai (completed)."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {podiumItems.length > 0 && <Podium items={podiumItems} getShare={getShare} />}

            {restItems.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-xs font-medium text-muted-foreground">Peringkat lainnya</p>
                <ol className={LIST_GRID}>
                  {restItems.map((item) => (
                    <li key={item.name} className="min-w-0">
                      <RankRow
                        item={item}
                        maxCompleted={maxCompleted}
                        share={getShare(item.totalCompleted)}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
}

function TopRankAdminCompletesWithHook(props) {
  const hookData = useEngineerMonitoringData();
  return (
    <TopRankAdminCompletesView
      {...props}
      completedTasks={hookData?.completedTasks || []}
      isLoading={hookData?.query?.isLoading || false}
    />
  );
}

export function TopRankAdminCompletes(props = {}) {
  if (props.completedTasks !== undefined) {
    return <TopRankAdminCompletesView {...props} />;
  }
  return <TopRankAdminCompletesWithHook {...props} />;
}

export default TopRankAdminCompletes;
