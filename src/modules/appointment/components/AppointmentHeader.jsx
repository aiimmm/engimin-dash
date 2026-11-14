import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { LiveOperationBadge } from "@/components/elements/LiveOperationBadge";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const AppointmentHeader = ({ dateRange, setDateRange, query }) => {
  return (
    <div className="flex flex-col items-start lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <LiveOperationBadge />
        <Typography as="h2" className="font-extrabold">
          Appointment Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Ringkasan jadwal work order appointment dan status penugasan engineer.
        </Typography>
      </div>
      <div className="flex flex-wrap gap-2">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
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
