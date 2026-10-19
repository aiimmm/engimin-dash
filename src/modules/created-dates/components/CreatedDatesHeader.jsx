"use client";

import { DatePickerWithRange } from "@/components/elements/DatePickerWithRange";
import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const CreatedDatesHeader = ({ query, dateRange, setDateRange }) => {
  return (
    <div className="flex flex-col items-start xl:flex-row xl:items-end xl:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-xl w-fit border bg-sidebar mb-3">
          <span className="size-1.5 rounded-full bg-green-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live Operation
          </p>
        </div>
        <Typography as="h2" className="font-extrabold">
          Created Dates Overview
        </Typography>
        <Typography as="p" className="text-sm text-muted-foreground mt-1">
          Ringkasan work orders yang dibuat hari ini atau dalam rentang tanggal yang dipilih.
        </Typography>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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
          />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
};

export const CreatedTodayHeader = CreatedDatesHeader;
