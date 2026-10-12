import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRoomStatusCategory } from "@/modules/shared/work-orders/lib";

export const StatsCard = ({
  label,
  value,
  helperText,
  icon: Icon,
  className = "",
  iconClassName = "text-primary",
}) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between space-x-2">
          <Typography
            as="p"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </Typography>
          {Icon && (
            <div className="rounded-lg bg-muted/60 p-2">
              <Icon className={`size-4 ${iconClassName}`} />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <Typography as="h3" className="text-2xl font-bold tracking-tight">
            {typeof value === "number" ? value.toLocaleString("id-ID") : (value ?? 0)}
          </Typography>
        </div>
        {helperText && (
          <Typography as="p" className="mt-1 text-[11px] text-muted-foreground">
            {helperText}
          </Typography>
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
        className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
      >
        New
      </Badge>
    );
  }

  if (s.includes("progress") || s === "active" || s === "2" || s === "on progress") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
      >
        On Progress
      </Badge>
    );
  }

  if (s.includes("complete") || s === "3" || s === "done" || s === "closed") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      >
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      {status || "—"}
    </Badge>
  );
};

export const RoomStatus = ({ status }) => {
  const cat = getRoomStatusCategory(status);

  if (cat === "Major") {
    return <Badge className="bg-destructive text-destructive-foreground">Major</Badge>;
  }

  if (cat === "Minor") {
    return <Badge className="bg-amber-500 text-white dark:bg-amber-600">Minor</Badge>;
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      —
    </Badge>
  );
};

export const CloseOutStatus = ({ isCloseOut }) => {
  const isClosed = Number(isCloseOut) === 1 || isCloseOut === "1" || isCloseOut === true;

  if (isClosed) {
    return <Badge className="bg-purple-600 text-white dark:bg-purple-700">Close Out</Badge>;
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
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
