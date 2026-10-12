import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

export const AppointmentHeader = ({ dateRange, setDateRange, query, onSyncSheet, isSyncing }) => {
  return (
    <div className="flex flex-col items-start lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <Badge className="uppercase tracking-widest text-black dark:text-white mb-3 border border-black/5 bg-neutral-200 dark:border-white/5 dark:bg-neutral-800">
          <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
          Live Operation
        </Badge>
        <Typography as="h2" className="font-extrabold">
          Appointment Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Data dimuat sekali berdasarkan date range dan diperbarui secara otomatis setiap 3 menit.
        </Typography>
      </div>
      <div className="flex flex-wrap gap-2">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
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
