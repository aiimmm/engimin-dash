import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { CalendarDaysIcon, RefreshCwIcon } from "lucide-react";

export const AllocationHeader = ({ query }) => {
  const tomorrowStr = tomorrow();
  const formattedTomorrow = formatDate(tomorrowStr);

  return (
    <div className="flex flex-col items-start xl:flex-row xl:items-end xl:justify-between gap-4">
      <div>
        <Badge className="uppercase tracking-widest text-black dark:text-white mb-3 border border-black/5 bg-neutral-200 dark:border-white/5 dark:bg-neutral-800">
          <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
          Live Operation
        </Badge>
        <Typography as="h2" className="font-extrabold">
          Tomorrow&apos;s Allocation Work Orders
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Menampilkan work orders yang dijadwalkan untuk besok di seluruh cluster. Diperbarui secara
          otomatis setiap 3 menit.
        </Typography>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-xs font-semibold shadow-xs whitespace-nowrap">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span>Tomorrow: {formattedTomorrow}</span>
        </div>
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
