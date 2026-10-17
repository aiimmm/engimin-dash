import { Typography } from "@/components/elements/Typography";
import { Calendar03Icon, PhoneIcon, User02Icon } from "@hugeicons/core-free-icons";
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
    if (match) return `${match[3]}/${match[2]}`;
    return str;
  };

  const ciFmt = fmtCheckDate(currentRes.checkinDate);
  const coFmt = fmtCheckDate(currentRes.checkoutDate);

  return (
    <div className="space-y-1 text-center">
      <div className="flex items-center justify-center gap-1 font-medium text-xs">
        <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-muted-foreground" />
        <span>
          {ciFmt} – {coFmt}
        </span>
      </div>
      <div>
        {currentRes.genId && (
          <Typography
            as="p"
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground truncate max-w-36"
          >
            <HugeiconsIcon icon={Calendar03Icon} className="size-3 text-muted-foreground" />
            {currentRes.genId}
          </Typography>
        )}
        {currentRes.guestName && (
          <Typography
            as="p"
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground truncate max-w-36"
          >
            <HugeiconsIcon icon={User02Icon} className="size-3 text-muted-foreground" />
            {currentRes.guestName}
          </Typography>
        )}
        {currentRes.contactPhone && (
          <Typography
            as="p"
            className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground truncate max-w-36"
          >
            <HugeiconsIcon icon={PhoneIcon} className="size-3 text-muted-foreground" />
            {currentRes.contactPhone}
          </Typography>
        )}
      </div>
    </div>
  );
}
