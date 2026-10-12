import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PauseCircleIcon, PlayCircleIcon, RefreshCwIcon } from "lucide-react";

export const AgingHeader = ({
  dateRange,
  setDateRange,
  query,
  onSyncSheet,
  isSyncing,
  isAutoRefreshPaused,
  onToggleAutoRefresh,
}) => {
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <Badge className="uppercase tracking-widest text-black dark:text-white mb-3 border border-black/5 bg-neutral-200 dark:border-white/5 dark:bg-neutral-800">
          <span
            className={`size-1.5 rounded-full mr-1 ${
              isAutoRefreshPaused ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          {isAutoRefreshPaused ? "Auto-Refresh Dijeda" : "Live Operation"}
        </Badge>
        <Typography as="h2" className="font-extrabold">
          Aging Work Orders Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Menampilkan work orders aging (WO Create dari 4 hari kebelakang s/d kemarin).
          {isAutoRefreshPaused
            ? " Auto-refresh halaman sedang dijeda."
            : " Diperbarui otomatis setiap 3 menit."}
        </Typography>
      </div>
      <div className="flex flex-wrap gap-2">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
        <Button size="lg" variant="outline" onClick={onToggleAutoRefresh}>
          {isAutoRefreshPaused ? (
            <>
              <PlayCircleIcon className="size-4" />
              Aktifkan Auto-Refresh
            </>
          ) : (
            <>
              <PauseCircleIcon className="size-4" />
              Hentikan Auto-Refresh
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onSyncSheet}
          disabled={isSyncing ? true : undefined}
        >
          <RefreshCwIcon className={isSyncing ? "animate-spin" : ""} />
          Sync Sheet
        </Button>
        <Button
          size="lg"
          variant="default"
          onClick={() => {
            if (!query.isFetching) query.refetch();
          }}
        >
          <RefreshCwIcon className={query.isFetching ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>
    </div>
  );
};

export default AgingHeader;
