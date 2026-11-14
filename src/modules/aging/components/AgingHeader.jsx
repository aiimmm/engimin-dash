import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { LiveOperationBadge } from "@/components/elements/LiveOperationBadge";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

export const AgingHeader = ({ dateRange, setDateRange, query }) => {
  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <LiveOperationBadge />
        <Typography as="h2" className="font-extrabold">
          Aging Work Orders Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Ringkasan work order aging yang dibuat dalam rentang 4 hari terakhir hingga kemarin.
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

export default AgingHeader;
