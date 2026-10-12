import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { yesterday } from "@/modules/shared/work-orders/lib";
import { CalendarDaysIcon, RefreshCwIcon } from "lucide-react";

export const ActionDatesHeader = ({ query }) => {
  const yesterdayStr = yesterday();
  const formattedYesterday = formatDate(yesterdayStr);

  return (
    <div className="flex flex-col items-start xl:flex-row xl:items-end xl:justify-between gap-4">
      <div>
        <Badge className="uppercase tracking-widest text-black dark:text-white mb-3 border border-black/5 bg-neutral-200 dark:border-white/5 dark:bg-neutral-800">
          <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
          Live Operation
        </Badge>

        <div className="flex items-center gap-2 border px-2 py-1 rounded-lg bg-card/10 shadow-xs">
          <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
          <Typography as="small" className="text-muted-foreground">
            Live Operation
          </Typography>
        </div>
        <Typography as="h2" className="font-extrabold">
          Yesterday&apos;s Action Dates
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Menampilkan work orders yang dijadwalkan untuk kemarin di seluruh cluster. Diperbarui
          secara otomatis setiap 3 menit.
        </Typography>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-xs font-semibold shadow-xs whitespace-nowrap">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span>Yesterday: {formattedYesterday}</span>
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
