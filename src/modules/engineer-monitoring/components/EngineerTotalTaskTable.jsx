"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, toTitleCase } from "@/lib/utils";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";

/* ---------- helpers ---------- */

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function cleanToken(str) {
  return String(str || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function toPercent(done, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

const TYPE_LABEL = {
  internal: "Internal",
  vendor: "Vendor",
};

// Warna hanya ditentukan oleh progres task, bukan tipe engineer:
// 100% selesai -> emerald, selain itu -> netral (tanpa warna)
const STATUS_STYLE = {
  complete: {
    card: "border-emerald-500/30 bg-linear-to-b from-emerald-500/10 via-card to-card",
    avatar: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    percent: "text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    card: "bg-linear-to-b from-primary/5 via-card to-card",
    avatar: "bg-muted text-muted-foreground border border-muted-foreground/10",
    pill: "bg-muted text-muted-foreground border border-muted-foreground/10",
    dot: "bg-muted-foreground/50",
    bar: "bg-foreground/40",
    percent: "text-muted-foreground",
  },
};

/* ---------- sub components ---------- */

function ProgressBar({ value, className }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", className)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="flex gap-3 overflow-x-hidden pb-1 pt-1">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="w-48 shrink-0 space-y-2.5 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2 w-12" />
            <div className="flex items-end justify-between gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
            <Skeleton className="h-2 w-26" />
          </div>
          <Skeleton className="h-px w-full rounded-full" />
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EngineerCard({ eng, type }) {
  const totalTask = eng.total_task ?? 0;
  const completed = eng.total_completed ?? 0;
  const engineerCompleted = eng.total_engineer_completed ?? 0;
  const totalUnit = eng.total_unit ?? 0;
  const unitCompleted = eng.total_unit_completed ?? 0;

  const taskPercent = toPercent(completed, totalTask);
  const unitPercent = toPercent(unitCompleted, totalUnit);

  const isComplete = totalTask > 0 && completed >= totalTask;
  const style = STATUS_STYLE[isComplete ? "complete" : "pending"];

  return (
    <Card
      className={cn(
        "relative flex w-48 shrink-0 snap-start flex-col gap-2 rounded-2xl p-4 transition-all hover:shadow-md sm:w-48",
        style.card,
      )}
    >
      {/* Header: avatar, nama, tipe */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-8.5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
            style.avatar,
          )}
        >
          {getInitials(eng.fullname)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[11px] font-semibold leading-tight" title={eng.fullname}>
            {toTitleCase(eng.fullname || "—")}
          </h4>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 h-3.5 text-[8px] font-medium leading-4",
              style.pill,
            )}
          >
            <span className={cn("size-1 rounded-full", style.dot)} />
            {TYPE_LABEL[type]}
          </span>
        </div>
      </div>

      {/* Task: angka utama + progress */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Task selesai</p>
            <p className="text-lg font-semibold leading-tight tabular-nums">
              {completed}
              <span className="text-[11px] font-normal text-muted-foreground"> / {totalTask}</span>
            </p>
          </div>
          <span className={cn("text-[11px] font-medium tabular-nums", style.percent)}>
            {taskPercent}%
          </span>
        </div>
        <ProgressBar value={taskPercent} className={style.bar} />
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{engineerCompleted}</span>
          &nbsp; diselesaikan engineer
        </p>
      </div>

      {/* Unit */}
      <div className="space-y-1 border-t pt-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Unit selesai</span>
          <span className="font-medium tabular-nums">
            {unitCompleted}
            <span className="font-normal text-muted-foreground"> / {totalUnit}</span>
          </span>
        </div>
        <ProgressBar value={unitPercent} className="bg-foreground/40" />
      </div>
    </Card>
  );
}

/* ---------- main ---------- */

export const EngineerTotalTaskTable = ({
  engineerTotals = [],
  query = {},
  internalEngineers = [],
  vendorEngineers = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'internal' | 'vendor'
  const scrollContainerRef = useRef(null);

  const buildTokenSet = (list) => {
    const set = new Set();
    (list || []).forEach((eng) => {
      [eng.username, eng.fullname, eng.name].forEach((v) => {
        const t = cleanToken(v);
        if (t && t.length >= 2) set.add(t);
      });
    });
    return set;
  };

  const vendorTokenSet = useMemo(() => buildTokenSet(vendorEngineers), [vendorEngineers]);
  const internalTokenSet = useMemo(() => buildTokenSet(internalEngineers), [internalEngineers]);

  const getEngineerType = useMemo(() => {
    return (fullname = "") => {
      const upper = String(fullname || "")
        .trim()
        .toUpperCase();
      if (
        upper.includes("VENDOR") ||
        upper.startsWith("VND ") ||
        upper.startsWith("V-") ||
        upper.startsWith("MITRA ")
      ) {
        return "vendor";
      }
      const token = cleanToken(upper);
      for (const v of vendorTokenSet) {
        if (token === v || (token.length >= 4 && v.startsWith(token))) return "vendor";
      }
      for (const i of internalTokenSet) {
        if (token === i || (token.length >= 4 && i.startsWith(token))) return "internal";
      }
      return "internal";
    };
  }, [vendorTokenSet, internalTokenSet]);

  // Buang data unassigned
  const validEngineers = useMemo(() => {
    return (engineerTotals || []).filter((eng) => {
      const name = String(eng.fullname || "")
        .trim()
        .toUpperCase();
      return name && name !== "UNASSIGNED" && name !== "—" && name !== "-" && name !== "NULL";
    });
  }, [engineerTotals]);

  const counts = useMemo(() => {
    const internal = validEngineers.filter((e) => getEngineerType(e.fullname) === "internal");
    return {
      all: validEngineers.length,
      internal: internal.length,
      vendor: validEngineers.length - internal.length,
    };
  }, [validEngineers, getEngineerType]);

  const filteredEngineers = useMemo(() => {
    let list = validEngineers;

    if (typeFilter !== "all") {
      list = list.filter((e) => getEngineerType(e.fullname) === typeFilter);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((eng) =>
        String(eng.fullname || "")
          .toLowerCase()
          .includes(q),
      );
    }

    return list;
  }, [validEngineers, typeFilter, searchQuery, getEngineerType]);

  const handleScroll = (direction) => {
    scrollContainerRef.current?.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const tabs = [
    { value: "all", label: "Semua" },
    { value: "internal", label: "Internal" },
    { value: "vendor", label: "Vendor" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <HugeiconsIcon icon={UserSettings01Icon} className="size-4" />
            Total Task Engineer
          </CardTitle>
          <CardDescription className="text-xs">
            Ringkasan akumulasi task dan unit per engineer internal dan vendor.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full lg:w-auto">
            <TabsList
              className={cn(
                "grid! h-auto! w-full! grid-cols-3 items-stretch gap-1 p-1",
                "overflow-hidden rounded-2xl bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5 sm:rounded-[min(var(--radius-4xl),24px)] dark:ring-foreground/10",
              )}
            >
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    "flex! h-6! w-full flex-none! text-xs items-center justify-center gap-2 rounded-2xl border-transparent border-0 px-3 whitespace-normal after:hidden",
                    "transition-colors hover:bg-foreground/3",
                    "data-active:bg-linear-to-t data-active:from-primary/5 data-active:to-card data-active:ring-1 data-active:ring-foreground/10",
                  )}
                >
                  {t.label}
                  <Badge
                    variant="default"
                    className="h-4 px-1 text-[10px] font-semibold tabular-nums"
                  >
                    {counts[t.value]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 max-lg:w-full">
            <InputGroup className="h-8 w-full lg:w-44">
              <InputGroupInput
                className="text-xs"
                placeholder="Cari engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => handleScroll("left")}
                title="Geser Kiri"
                aria-label="Geser Kiri"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => handleScroll("right")}
                title="Geser Kanan"
                aria-label="Geser Kanan"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="pt-4">
        {query.isLoading ? (
          <LoadingCards />
        ) : query.isError ? (
          <div className="grid min-h-32 place-items-center p-4 text-center">
            <div>
              <HugeiconsIcon icon={Alert02Icon} className="mx-auto size-7 text-destructive" />
              <p className="mt-2 text-xs font-semibold">Gagal memuat data total task engineer</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{query.error?.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => query.refetch && query.refetch()}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : filteredEngineers.length === 0 ? (
          <div className="grid min-h-24 place-items-center p-4 text-center text-xs text-muted-foreground">
            Tidak ada data engineer ditemukan.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-smooth pb-4 focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Total Task Engineer horizontal scroll"
          >
            {filteredEngineers.map((eng, idx) => (
              <EngineerCard
                key={eng.fullname || idx}
                eng={eng}
                type={getEngineerType(eng.fullname)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default EngineerTotalTaskTable;
