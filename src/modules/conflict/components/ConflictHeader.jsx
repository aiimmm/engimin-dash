import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { LiveOperationBadge } from "@/components/elements/LiveOperationBadge";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

export const ConflictHeader = ({ dateRange, setDateRange, query }) => {
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <LiveOperationBadge />
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
