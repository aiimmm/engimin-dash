"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, toTitleCase } from "@/lib/utils";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building01Icon,
  ClipboardListIcon,
  Search01Icon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useRef, useState } from "react";

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

function LoadingCards() {
  return (
    <div className="flex gap-3 overflow-x-hidden pb-2 pt-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="shrink-0 w-64 sm:w-72 rounded-2xl border p-4 space-y-3 bg-muted/20"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export const EngineerTotalTaskTable = ({
  engineerTotals = [],
  query = {},
  internalEngineers = [],
  vendorEngineers = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'internal' | 'vendor'
  const scrollContainerRef = useRef(null);

  // Build token sets for internal & vendor lookup
  const vendorTokenSet = useMemo(() => {
    const set = new Set();
    (vendorEngineers || []).forEach((eng) => {
      [eng.username, eng.fullname, eng.name].forEach((v) => {
        const t = cleanToken(v);
        if (t && t.length >= 2) set.add(t);
      });
    });
    return set;
  }, [vendorEngineers]);

  const internalTokenSet = useMemo(() => {
    const set = new Set();
    (internalEngineers || []).forEach((eng) => {
      [eng.username, eng.fullname, eng.name].forEach((v) => {
        const t = cleanToken(v);
        if (t && t.length >= 2) set.add(t);
      });
    });
    return set;
  }, [internalEngineers]);

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
      return upper.includes("VENDOR") ? "vendor" : "internal";
    };
  }, [vendorTokenSet, internalTokenSet]);

  // Clean raw data by eliminating unassigned entries
  const validEngineers = useMemo(() => {
    return (engineerTotals || []).filter((eng) => {
      const name = String(eng.fullname || "")
        .trim()
        .toUpperCase();
      return name && name !== "UNASSIGNED" && name !== "—" && name !== "-" && name !== "NULL";
    });
  }, [engineerTotals]);

  // Counts for tabs
  const internalCount = useMemo(() => {
    return validEngineers.filter((e) => getEngineerType(e.fullname) === "internal").length;
  }, [validEngineers, getEngineerType]);

  const vendorCount = useMemo(() => {
    return validEngineers.filter((e) => getEngineerType(e.fullname) === "vendor").length;
  }, [validEngineers, getEngineerType]);

  // Apply type filter and search filter
  const filteredEngineers = useMemo(() => {
    let list = validEngineers;

    // Type filter
    if (typeFilter === "internal") {
      list = list.filter((e) => getEngineerType(e.fullname) === "internal");
    } else if (typeFilter === "vendor") {
      list = list.filter((e) => getEngineerType(e.fullname) === "vendor");
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((eng) => {
        const name = String(eng.fullname || "").toLowerCase();
        return name.includes(q);
      });
    }

    return list;
  }, [validEngineers, typeFilter, searchQuery, getEngineerType]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={UserSettings01Icon} className="size-5 text-muted-foreground" />
              Total Task Engineer
            </CardTitle>
            <CardDescription className="mt-1">
              Ringkasan akumulasi task dan unit per engineer internal dan vendor.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs menggunakan shadcn UI Tabs */}
            <Tabs value={typeFilter} onValueChange={(val) => setTypeFilter(val)} className="w-auto">
              <TabsList className="bg-muted/60 p-1 h-9 rounded-xl">
                <TabsTrigger
                  value="all"
                  className="gap-1.5 px-3 py-1 text-xs font-medium rounded-lg data-active:bg-background data-active:text-foreground data-active:shadow-xs"
                >
                  Semua
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] h-4 rounded-md font-semibold"
                  >
                    {validEngineers.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="internal"
                  className="gap-1.5 px-3 py-1 text-xs font-medium rounded-lg data-active:bg-background data-active:text-emerald-600 dark:data-active:text-emerald-400 data-active:shadow-xs"
                >
                  Internal
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] h-4 rounded-md font-semibold"
                  >
                    {internalCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="vendor"
                  className="gap-1.5 px-3 py-1 text-xs font-medium rounded-lg data-active:bg-background data-active:text-amber-600 dark:data-active:text-amber-400 data-active:shadow-xs"
                >
                  Vendor
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] h-4 rounded-md font-semibold"
                  >
                    {vendorCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Input */}
            <InputGroup className="w-44 sm:w-52">
              <InputGroupInput
                placeholder="Cari engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            {/* Left & Right Scroll Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => handleScroll("left")}
                title="Geser Kiri"
                aria-label="Geser Kiri"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => handleScroll("right")}
                title="Geser Kanan"
                aria-label="Geser Kanan"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {query.isLoading ? (
          <LoadingCards />
        ) : query.isError ? (
          <div className="grid min-h-48 place-items-center p-6 text-center">
            <div>
              <HugeiconsIcon icon={Alert02Icon} className="mx-auto size-9 text-destructive" />
              <p className="mt-3 font-semibold text-sm">Gagal memuat data total task engineer</p>
              <p className="mt-1 text-xs text-muted-foreground">{query.error?.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => query.refetch && query.refetch()}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : filteredEngineers.length === 0 ? (
          <div className="grid min-h-36 place-items-center p-6 text-center text-muted-foreground text-sm">
            Tidak ada data engineer ditemukan.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Total Task Engineer horizontal scroll"
          >
            {filteredEngineers.map((eng, idx) => {
              const engType = getEngineerType(eng.fullname);
              const isVendor = engType === "vendor";

              const completed = eng.total_completed ?? 0;
              const engineerCompleted = eng.total_engineer_completed ?? 0;
              const totalTask = eng.total_task ?? 0;
              const unitCompleted = eng.total_unit_completed ?? 0;
              const totalUnit = eng.total_unit ?? 0;

              return (
                <div
                  key={eng.fullname || idx}
                  className="shrink-0 w-64 sm:w-72 rounded-2xl border bg-card/80 backdrop-blur-xs p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 snap-start"
                >
                  {/* Line 1: Nama Engineer + Badge Tipe */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs uppercase",
                        isVendor
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {getInitials(eng.fullname)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4
                          className="font-semibold text-sm truncate text-foreground"
                          title={eng.fullname}
                        >
                          {toTitleCase(eng.fullname || "—")}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium",
                            isVendor
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                          )}
                        >
                          {isVendor ? "Vendor" : "Internal"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {isVendor ? "Engineer Vendor" : "Engineer Internal"}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 pt-2 border-t">
                    {/* Line 2: Total Engineer Completed / Total Completed / Total Task */}
                    <div className="flex items-center justify-between bg-muted/50 dark:bg-muted/30 px-3 py-2 rounded-xl text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-sans font-medium">
                        <HugeiconsIcon
                          icon={ClipboardListIcon}
                          className="size-3.5 text-muted-foreground"
                        />
                        Task:
                      </span>
                      <div className="flex items-center gap-1 font-semibold">
                        <span
                          className="text-emerald-600 dark:text-emerald-400"
                          title="Total Completed"
                        >
                          {completed}
                        </span>
                        <span className="text-muted-foreground/40 font-normal">/</span>
                        <span
                          className="text-sky-600 dark:text-sky-400"
                          title="Total Engineer Completed"
                        >
                          {engineerCompleted}
                        </span>
                        <span className="text-muted-foreground/40 font-normal">/</span>
                        <span className="text-foreground" title="Total Task">
                          {totalTask}
                        </span>
                      </div>
                    </div>

                    {/* Line 3: Total Unit Completed / Total Unit */}
                    <div className="flex items-center justify-between bg-muted/50 dark:bg-muted/30 px-3 py-2 rounded-xl text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-sans font-medium">
                        <HugeiconsIcon
                          icon={Building01Icon}
                          className="size-3.5 text-muted-foreground"
                        />
                        Unit:
                      </span>
                      <div className="flex items-center gap-1 font-semibold">
                        <span
                          className="text-sky-600 dark:text-sky-400"
                          title="Total Unit Completed"
                        >
                          {unitCompleted}
                        </span>
                        <span className="text-muted-foreground/40 font-normal">/</span>
                        <span className="text-foreground" title="Total Unit">
                          {totalUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EngineerTotalTaskTable;
