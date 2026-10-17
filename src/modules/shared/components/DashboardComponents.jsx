import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRoomStatusCategory } from "@/modules/shared/work-orders/lib";
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
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="flex items-start justify-between gap-4">
        {/* Informasi statistik */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Typography
            as="p"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </Typography>

          <Typography as="h3" className="font-bold tracking-tight mt-1">
            {displayValue}
          </Typography>

          {helperText && (
            <Typography as="p" className="text-[11px] text-muted-foreground/80">
              {helperText}
            </Typography>
          )}
        </div>

        {/* Hugeicons */}
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center",
              "rounded-xl border border-black/5 bg-neutral-200!",
              "dark:border-white/5 dark:bg-neutral-800!",
            )}
          >
            <HugeiconsIcon
              icon={icon}
              className={cn("size-5!", iconClassName)}
              aria-hidden="true"
            />
          </div>
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
