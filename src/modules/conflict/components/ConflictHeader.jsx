import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { PauseCircleIcon, PlayCircleIcon, RefreshCwIcon } from "lucide-react";

export const ConflictHeader = ({
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
        <div className="flex items-center gap-2 px-2 py-1 rounded-xl w-fit border bg-sidebar mb-3">
          <span className="size-1.5 rounded-full bg-green-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live Operation
          </p>
        </div>
        <Typography as="h2" className="font-extrabold">
          Conflict Dates Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Ringkasan work orders yang dijadwalkan kemarin atau dalam rentang tanggal action date yang
          dipilih.
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
