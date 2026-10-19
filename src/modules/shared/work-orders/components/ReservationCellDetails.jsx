import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDataTransferHorizontalIcon,
  ContactBookIcon,
  PhoneIcon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ReservationCellDetails({ row }) {
  const currentRes = row.original.activeReservation || row.original.latestReservation;

  if (!currentRes || (!currentRes.checkinDate && !currentRes.checkoutDate)) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const fmtCheckDate = (dStr) => {
    if (!dStr) return "—";

    const str = String(dStr).trim();

    if (/^\d{8}$/.test(str)) {
      return `${str.slice(6, 8)}/${str.slice(4, 6)}`;
    }

    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return `${match[3]}/${match[2]}`;
    }

    return str;
  };

  const ciFmt = fmtCheckDate(currentRes.checkinDate);
  const coFmt = fmtCheckDate(currentRes.checkoutDate);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-48 flex-col items-center gap-1 py-1">
      {currentRes.genId && (
        <Badge
          variant="secondary"
          className="flex border-border items-center truncate text-xs leading-none gap-1.5"
        >
          <HugeiconsIcon icon={ContactBookIcon} className="size-4 shrink-0 text-muted-foreground" />

          {/* <Typography as="p" className="truncate text-xs font-semibold leading-none"> */}
          {currentRes.genId}
          {/* </Typography> */}
        </Badge>
      )}

      <div className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
        <HugeiconsIcon
          icon={ArrowDataTransferHorizontalIcon}
          className="size-3.5 shrink-0 text-muted-foreground"
        />

        <Typography as="p" className="text-xs font-medium tabular-nums">
          {ciFmt} – {coFmt}
        </Typography>
      </div>

      <div>
        {currentRes.guestName && (
          <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
            <HugeiconsIcon icon={User02Icon} className="size-3.5 shrink-0 text-muted-foreground" />

            <Typography as="p" className="min-w-0 truncate text-xs text-muted-foreground">
              {currentRes.guestName}
            </Typography>
          </div>
        )}

        {currentRes.contactPhone && (
          <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
            <HugeiconsIcon icon={PhoneIcon} className="size-3.5 shrink-0 text-muted-foreground" />

            <Typography as="p" className="min-w-0 truncate text-xs text-muted-foreground">
              {currentRes.contactPhone}
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}
