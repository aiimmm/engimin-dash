import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import {
  BreakContractNotice,
  CloseOutStatus,
  RoomStatus,
  TracingScheduleStatus,
  WorkOrderStatus,
} from "@/modules/shared/components/DashboardComponents";
import {
  ApartmentIcon,
  AppleReminderIcon,
  BedDoubleIcon,
  CalendarCheckIn01Icon,
  CalendarCheckOut01Icon,
  CalendarClockIcon,
  DepartementIcon,
  NoteIcon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createColumnHelper } from "@tanstack/react-table";

function fmtDate(value) {
  if (!value) return "—";
  const str = String(value).trim();
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(6, 8)}-${str.slice(4, 6)}-${str.slice(0, 4)}`;
  }
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return str;
}

const helper = createColumnHelper();

export const CreatedDatesColumns = helper.columns([
  helper.accessor("woNumber", {
    id: "WO & Note",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 text-xs font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
      >
        <HugeiconsIcon icon={NoteIcon} className="mr-0.5 size-4 text-muted-foreground" />
        WO No & Note
      </Button>
    ),
    cell: ({ getValue, row }) => {
      const woNum = getValue() || row.original.id || "—";
      const rawStatus = String(row.original.woStatus || row.original.status || "");
      const href = getWorkOrderTracingUrl(woNum, rawStatus);
      const note = row.original.remark || row.original.note || "—";

      const handleWoClick = (e) => {
        e.preventDefault();

        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(e.currentTarget);
        selection.removeAllRanges();
        selection.addRange(range);
      };

      const handleWoDoubleClick = (e) => {
        e.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      };

      return (
        <div className="w-full max-w-sm space-y-0.5">
          <div>
            <span
              onClick={handleWoClick}
              onDoubleClick={handleWoDoubleClick}
              className="cursor-pointer select-text text-xs font-mono font-medium hover:underline"
              title="Klik untuk select, double click untuk membuka"
            >
              {woNum}
            </span>
          </div>

          <Typography
            as="p"
            className="select-none whitespace-normal text-[10px] text-muted-foreground line-clamp-4"
          >
            {note}
          </Typography>
        </div>
      );
    },
    meta: { label: "WO No & Note" },
    sortingFn: "alphanumeric",
  }),

  helper.accessor("foRoomsId", {
    id: "Current Reservation",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
      >
        <HugeiconsIcon
          icon={CalendarCheckOut01Icon}
          className="mr-0.5 size-4 text-muted-foreground"
        />
        Current Reservation
      </Button>
    ),
    cell: ({ row }) => {
      const reservation = row.original.activeReservation || row.original.latestReservation;
      if (!reservation?.genId) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="min-w-32">
          <Typography as="p" className="font-medium text-xs mb-1 italic">
            BookID: {reservation.genId}
          </Typography>
          <Typography as="p" className="text-[10px] text-muted-foreground">
            Check-In: {fmtDate(reservation.checkinDate)}
          </Typography>
          <Typography as="p" className="mt-px text-[10px] text-muted-foreground">
            Check-Out: {fmtDate(reservation.checkoutDate)}
          </Typography>
        </div>
      );
    },
    meta: { label: "Current Reservation" },
    sortingFn: "alphanumeric",
  }),
  helper.accessor("futureBookNumber", {
    id: "Future Reservation",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
      >
        <HugeiconsIcon
          icon={CalendarCheckIn01Icon}
          className="mr-0.5 size-4 text-muted-foreground"
        />
        Future Reservation
      </Button>
    ),
    cell: ({ row }) => {
      const futureBookNumber = row.original.futureBookNumber;

      if (!futureBookNumber || futureBookNumber === "—" || futureBookNumber === "-") {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      const future = row.original.futureReservation;
      const ciDate = future?.checkinDate || row.original.ciDate;
      const coDate = future?.checkoutDate || row.original.coDate;

      return (
        <div className="min-w-32">
          <Typography as="p" className="font-medium text-xs mb-1 italic">
            BookID: {future?.genId || futureBookNumber}
          </Typography>
          <Typography as="p" className="text-[10px] text-muted-foreground">
            Check-In: {fmtDate(ciDate)}
          </Typography>
          <Typography as="p" className="mt-px text-[10px] text-muted-foreground">
            Check-Out: {fmtDate(coDate)}
          </Typography>
        </div>
      );
    },
    meta: { label: "Future Reservation" },
    sortingFn: "alphanumeric",
  }),

  helper.accessor("actionDate", {
    id: "Action Date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs px-0 font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
        >
          <HugeiconsIcon icon={CalendarClockIcon} className="mr-0.5 size-4 text-muted-foreground" />
          Action Date
        </Button>
      );
    },
    meta: { label: "Action Date" },
    cell: ({ getValue }) => {
      const rawDate = getValue();

      if (!rawDate) {
        return <span className="text-xs">—</span>;
      }

      const str = String(rawDate).trim();
      const datePart = str.substring(0, 10);
      const timePart = str.length > 10 ? str.substring(11, 16) : "";

      // Parse tanggal sebagai tanggal lokal agar tidak bergeser timezone
      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const hari = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
      }).format(date);
      const tanggal = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;

      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs capitalize">{hari},</span>
          <span className="text-xs">{tanggal}</span>
          <span className="text-xs">{timePart || "—"}</span>
        </div>
      );
    },
    sortingFn: "alphanumeric",
  }),

  helper.accessor((row) => `${row.roomCode} — ${row.towerName} — ${row.roomName}`, {
    id: "property",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 text-xs font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
      >
        <HugeiconsIcon icon={ApartmentIcon} className="mr-0.5 size-4 text-muted-foreground" />
        GenID — Tower — Room
      </Button>
    ),
    cell: ({ row }) => {
      const data = row.original;

      return (
        <div className="min-w-44 space-y-1">
          <Typography as="p" className="mb-1 text-xs font-medium italic">
            GenID: {data.roomCode || "—"}
          </Typography>

          <Typography as="p" className="text-xs font-medium">
            {data.towerName || "—"}
          </Typography>

          <Typography as="p" className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <HugeiconsIcon icon={BedDoubleIcon} className="size-3 text-muted-foreground" />
            {data.roomName || "—"}
          </Typography>

          <BreakContractNotice data={data} />
        </div>
      );
    },
    meta: { label: "GenID — Tower — Room" },
    sortingFn: "text",
  }),

  helper.accessor(
    (row) =>
      `${row.roomStatus ?? ""} ${row.isIncludeCloseOut ?? ""} ${row.woStatus ?? ""} ${row.reservationtraces_status ?? ""}`,
    {
      id: "WO Status",
      header: ({ column }) => (
        <div className="flex w-full justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="mx-auto px-0 text-xs font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
          >
            <HugeiconsIcon
              icon={AppleReminderIcon}
              className="mr-0.5 size-4 text-muted-foreground"
            />
            WO Status
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex min-w-36 flex-col items-center gap-2">
          {/* Work Order Status */}
          <div className="flex items-center gap-2">
            <WorkOrderStatus status={row.original.woStatus} />
          </div>

          {/* Tracing Schedule Status */}
          <div className="flex items-center gap-2">
            <TracingScheduleStatus row={row.original} />
          </div>

          {/* Room Status */}
          <div className="flex items-center gap-2">
            <RoomStatus status={row.original.roomStatus} />
          </div>

          {/* Close Out Status */}
          <div className="flex items-center gap-2">
            <CloseOutStatus isCloseOut={row.original.isIncludeCloseOut} />
          </div>
        </div>
      ),
      meta: { label: "WO Status" },
      sortingFn: "text",
    },
  ),

  helper.accessor("engineer", {
    id: "Engineer",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs px-0 font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
        >
          <HugeiconsIcon
            icon={UserSettings01Icon}
            className="mr-0.5 size-4 text-muted-foreground"
          />
          Engineer
        </Button>
      );
    },
    cell: ({ getValue }) => {
      const value = getValue() || "";
      const isUnassigned = !value || String(value).toUpperCase().includes("UNASSIGNED");
      return (
        <div className="flex justify-center items-center">
          <span
            className={`text-xs ${
              isUnassigned ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            }`}
          >
            {value ? toTitleCase(value) : "Unassigned"}
          </span>
        </div>
      );
    },
    meta: { label: "Engineer" },
    sortingFn: "text",
  }),

  helper.accessor("department", {
    id: "Department",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
      >
        <HugeiconsIcon icon={DepartementIcon} className="mr-0.5 size-4 text-muted-foreground" />
        Department
      </Button>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center">
        <span className="text-xs capitalize">{getValue() || "—"}</span>
      </div>
    ),
    meta: { label: "Department" },
    sortingFn: "text",
  }),
]);
