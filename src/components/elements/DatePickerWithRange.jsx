"use client";

// import { Button } from "@/components/ui/button";
import { Calendar02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format, isValid, parse } from "date-fns";
import * as React from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const DATE_FMT = "yyyy-MM-dd";

const toDate = (value) => {
  if (!value) return undefined;
  const parsed = parse(value, DATE_FMT, new Date());
  return isValid(parsed) ? parsed : undefined;
};

const toStr = (value) => (value ? format(value, DATE_FMT) : "");

/**
 * dateRange: { from: "yyyy-MM-dd", to: "yyyy-MM-dd" }
 * setDateRange: (updaterOrValue) => void  // sama pola dengan useState setter
 */
export function DatePickerWithRange({ dateRange, setDateRange, className }) {
  const selected = React.useMemo(
    () => ({
      from: toDate(dateRange?.from),
      to: toDate(dateRange?.to),
    }),
    [dateRange?.from, dateRange?.to],
  );

  const handleSelect = (range) => {
    setDateRange((prev) => ({
      ...prev,
      from: toStr(range?.from),
      to: toStr(range?.to),
    }));
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" id="date-picker-range" className={`text-xs ${className ?? ""}`}>
            <HugeiconsIcon
              icon={Calendar02Icon}
              data-icon="inline-start"
              className="mr-0.5 size-4"
            />
            {selected.from ? (
              selected.to ? (
                <>
                  {format(selected.from, "LLL dd, y")} - {format(selected.to, "LLL dd, y")}
                </>
              ) : (
                format(selected.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={selected.from}
          selected={selected}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
