import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBreakContractNotice, getRoomStatusCategory } from "@/modules/shared/work-orders/lib";
import { HugeiconsIcon } from "@hugeicons/react";

export const StatsCard = ({
  label,
  value,
  helperText,
  icon,
  className = "",
  iconClassName = "text-primary",
}) => {
  const displayValue = typeof value === "number" ? value.toLocaleString("id-ID") : (value ?? 0);

  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden bg-linear-to-br from-primary/5 via-card to-card transition-all hover:shadow-md",
        className,
      )}
    >
      {/* Background Icon */}
      {icon && (
        <div className="pointer-events-none absolute -right-4 -bottom-5 z-0 -rotate-12 opacity-[0.06]">
          <HugeiconsIcon
            icon={icon}
            className={cn("size-28 sm:size-32", iconClassName)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Statistics */}
      <CardContent className="relative z-10 flex min-w-0 flex-col">
        <Typography
          as="p"
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
        </Typography>

        <Typography as="h3" className="mt-1 font-bold tracking-tight">
          {displayValue}
        </Typography>

        {helperText && (
          <Typography className="text-[10px] text-muted-foreground/80">{helperText}</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const WorkOrderStatus = ({ status }) => {
  const s = String(status || "").toLowerCase();

  if (s === "new" || s === "1" || s === "new work order") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-950/50 dark:border-blue-400/20 dark:text-blue-400"
      >
        New
      </Badge>
    );
  }

  if (s.includes("progress") || s === "active" || s === "2" || s === "on progress") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-400/20 dark:text-yellow-400"
      >
        On Progress
      </Badge>
    );
  }

  if (s.includes("complete") || s === "3" || s === "done" || s === "closed") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-green-100 border-green-400 text-green-700 dark:bg-green-950/50 dark:border-green-400/20 dark:text-green-400"
      >
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0.5 text-muted-foreground">
      {status || "—"}
    </Badge>
  );
};

export const RoomStatus = ({ status }) => {
  const cat = getRoomStatusCategory(status);

  if (cat === "Major") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-red-100 border-red-400 text-red-700 dark:bg-red-950/50 dark:border-red-400/20 dark:text-red-400"
      >
        Major
      </Badge>
    );
  }

  if (cat === "Minor") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-green-100 border-green-400 text-green-700 dark:bg-green-950/50 dark:border-green-400/20 dark:text-green-400"
      >
        Minor
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0.5 text-muted-foreground">
      —
    </Badge>
  );
};

export const CloseOutStatus = ({ isCloseOut }) => {
  const isClosed = Number(isCloseOut) === 1 || isCloseOut === "1" || isCloseOut === true;

  if (isClosed) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-red-100 border-red-400 text-red-700 dark:bg-red-950/50 dark:border-red-400/20 dark:text-red-400"
      >
        Close Out
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] h-4 px-1.5 py-0.5 bg-green-100 border-green-400 text-green-700 dark:bg-green-950/50 dark:border-green-400/20 dark:text-green-400"
    >
      Open
    </Badge>
  );
};

export const EngineerStatus = ({ status }) => {
  const s = String(status || "").toLowerCase();

  if (s.includes("working") || s.includes("on progress") || s.includes("assigned")) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      >
        Working
      </Badge>
    );
  }

  if (s.includes("idle") || s.includes("available")) {
    return (
      <Badge
        variant="outline"
        className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
      >
        Idle
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      {status || "—"}
    </Badge>
  );
};

export const TracingScheduleStatus = ({ row, status: statusProp }) => {
  const traceStatus = String(
    statusProp ||
      row?.reservationtraces_status ||
      row?.reservationtrace_status ||
      row?.traces_status ||
      row?.tracingSchedule?.[0]?.status ||
      row?.tracing_schedule?.[0]?.status ||
      "",
  ).trim();

  const rejectDate =
    row?.rejected_wo_guarantee_date &&
    row?.rejected_wo_guarantee_date !== "—" &&
    row?.rejected_wo_guarantee_date !== "-"
      ? row.rejected_wo_guarantee_date
      : null;

  const isRejectedGuarantee =
    Boolean(rejectDate) ||
    /rejected\s+wo\s+guarantee/i.test(traceStatus) ||
    (Array.isArray(row?.tracingSchedule) &&
      row.tracingSchedule.some(
        (t) =>
          (Boolean(t?.rejected_wo_guarantee_date) &&
            t?.rejected_wo_guarantee_date !== "—" &&
            t?.rejected_wo_guarantee_date !== "-") ||
          /rejected\s+wo\s+guarantee/i.test(String(t?.status || "")),
      )) ||
    (Array.isArray(row?.tracing_schedule) &&
      row.tracing_schedule.some(
        (t) =>
          (Boolean(t?.rejected_wo_guarantee_date) &&
            t?.rejected_wo_guarantee_date !== "—" &&
            t?.rejected_wo_guarantee_date !== "-") ||
          /rejected\s+wo\s+guarantee/i.test(String(t?.status || "")),
      ));

  if (isRejectedGuarantee) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-red-100 border-red-400 text-red-700 dark:bg-red-950/50 dark:border-red-400/20 dark:text-red-400"
      >
        Rejected Guarantee
      </Badge>
    );
  }

  if (/rejected/i.test(traceStatus)) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-red-100 border-red-400 text-red-700 dark:bg-red-950/50 dark:border-red-400/20 dark:text-red-400"
      >
        Rejected
      </Badge>
    );
  }

  if (/completed/i.test(traceStatus)) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-green-100 border-green-400 text-green-700 dark:bg-green-950/50 dark:border-green-400/20 dark:text-green-400"
      >
        Completed
      </Badge>
    );
  }

  if (/arrived/i.test(traceStatus)) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-sky-100 border-sky-400 text-sky-700 dark:bg-sky-950/50 dark:border-sky-400/20 dark:text-sky-400"
      >
        Arrived
      </Badge>
    );
  }

  if (/pending/i.test(traceStatus)) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-400/20 dark:text-yellow-400"
      >
        Pending
      </Badge>
    );
  }

  if (/new/i.test(traceStatus) || !traceStatus || traceStatus === "—") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 px-1.5 py-0.5 bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-950/50 dark:border-blue-400/20 dark:text-blue-400"
      >
        New
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0.5 text-muted-foreground">
      {traceStatus}
    </Badge>
  );
};

export const BreakContractNotice = ({ data, baseDate }) => {
  const notice = getBreakContractNotice(data, baseDate);
  if (!notice) return null;

  if (notice.type === "upcoming") {
    return (
      <div className="flex flex-wrap items-center gap-1 text-[10px]">
        <span className="font-medium text-amber-600 dark:text-amber-400">
          Akan break contract pada:
        </span>
        <Typography
          as="span"
          className="text-[10px] font-medium text-amber-600 dark:text-amber-400"
        >
          {notice.date}
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-[10px]">
      <span className="font-medium text-red-600 dark:text-red-400">Break Contract:</span>
      <Typography as="span" className="text-[10px] font-medium text-red-600 dark:text-red-400">
        {notice.date}
      </Typography>
    </div>
  );
};
