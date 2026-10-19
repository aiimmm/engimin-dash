import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshCwIcon } from "lucide-react";

export const AppointmentHeader = ({ dateRange, setDateRange, query, onSyncSheet, isSyncing }) => {
  return (
    <div className="flex flex-col items-start lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-xl w-fit border bg-sidebar mb-3">
          <span className="size-1.5 rounded-full bg-green-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live Operation
          </p>
        </div>
        <Typography as="h2" className="font-extrabold">
          Appointment Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Ringkasan jadwal work order appointment dan status penugasan engineer.
        </Typography>
      </div>
      <div className="flex flex-wrap gap-2">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
        <Button variant="outline" onClick={onSyncSheet} disabled={isSyncing ? true : undefined}>
          <RefreshCwIcon className={isSyncing ? "animate-spin" : ""} />
          Sync Sheet
        </Button>
        <Button
          variant="default"
          onClick={() => {
            if (!query.isFetching) query.refetch();
          }}
        >
          <HugeiconsIcon
            icon={Refresh01Icon}
            className={`mr-0.5 size-4 ${query.isFetching ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </div>
    </div>
  );
};
