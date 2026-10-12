"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import {
  EngineerStatus,
  RoomStatus,
  WorkOrderStatus,
} from "@/modules/shared/components/DashboardComponents";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BedDoubleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  UserCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

const helper = createColumnHelper();

function formatActionDate(rawDate) {
  if (!rawDate || rawDate === "—" || rawDate === "-") return "—";
  const str = String(rawDate).trim();
  // Match format "Tue, 15-09-26 20:19" or "15-09-2026 20:19"
  const customMatch = str.match(/(?:[A-Za-z]+,\s*)?(\d{2})-(\d{2})-(\d{2,4})\s+(\d{2}:\d{2})/);
  if (customMatch) {
    const [, d, m, y, time] = customMatch;
    const fullYear = y.length === 2 ? `20${y}` : y;
    return `${fullYear}-${m}-${d} — ${time}`;
  }
  // Match standard format "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  if (str.length >= 10 && str.includes("-")) {
    const datePart = str.substring(0, 10);
    const timePart = str.length >= 16 ? str.substring(11, 16) : "00:00";
    return `${datePart} — ${timePart}`;
  }
  return str;
}

const getGuestAppointmentBadge = (val) => {
  const isYes = String(val).toLowerCase() === "yes" || val === 1 || val === true;
  return isYes ? (
    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      Yes
    </Badge>
  ) : (
    <Badge className="bg-muted text-muted-foreground">No</Badge>
  );
};

export const EngineerTaskColumns = helper.columns([
  helper.accessor("id", {
    id: "WO & Note",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <WrenchIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        WO & Note
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
        <div className="min-w-44 max-w-64 space-y-1">
          <div>
            <span
              onClick={handleWoClick}
              onDoubleClick={handleWoDoubleClick}
              className="cursor-pointer select-text text-xs font-mono font-medium text-primary hover:underline"
              title="Klik untuk select, double click untuk membuka"
            >
              {woNum}
            </span>
          </div>

          <Typography
            as="p"
            className="select-none whitespace-normal text-xs text-muted-foreground line-clamp-2"
          >
            {note}
          </Typography>
        </div>
      );
    },
    meta: { label: "WO & Note" },
    sortingFn: "alphanumeric",
  }),

  helper.accessor("schedule_date", {
    id: "Action Date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Action Date
      </Button>
    ),
    cell: ({ getValue }) => {
      const formatted = formatActionDate(getValue());
      if (!formatted || formatted === "—")
        return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs whitespace-nowrap font-medium">{formatted}</span>;
    },
    meta: { label: "Action Date" },
    sortingFn: "alphanumeric",
  }),

  helper.accessor("fullname", {
    id: "Engineer Name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <UserCheckIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Engineer Name
      </Button>
    ),
    cell: ({ getValue }) => {
      const value = getValue() || "";
      const isUnassigned = !value || String(value).toUpperCase().includes("UNASSIGNED");
      return (
        <div className="flex justify-center">
          <span
            className={`text-xs font-medium ${
              isUnassigned ? "text-red-600 dark:text-red-400" : "text-foreground"
            }`}
          >
            {value ? toTitleCase(value) : "Unassigned"}
          </span>
        </div>
      );
    },
    meta: { label: "Engineer Name" },
    sortingFn: "text",
  }),

  helper.accessor(
    (row) => `${row.roomCode || ""} — ${row.towerName || ""} — ${row.roomName || ""}`,
    {
      id: "GenID — Tower — Room",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold"
        >
          <BedDoubleIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          GenID — Tower — Room
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-44">
          <Typography as="p" className="font-medium text-xs mb-1 italic">
            GenID: {row.original.roomCode}
          </Typography>
          <Typography as="p" className="font-medium text-xs">
            {row.original.towerName}
          </Typography>
          <Typography
            as="p"
            className="mt-0.75 flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <BedDoubleIcon className="size-3" />
            {row.original.roomName}
          </Typography>
        </div>
      ),
      meta: { label: "GenID — Tower — Room" },
      sortingFn: "text",
    },
  ),

  helper.accessor("room_status", {
    id: "Room Status",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <BedDoubleIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Room Status
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const status = getValue();
      if (!status || status === "—")
        return <div className="text-center text-xs text-muted-foreground">—</div>;
      return (
        <div className="flex justify-center items-center">
          <RoomStatus status={status} />
        </div>
      );
    },
    meta: { label: "Room Status" },
    sortingFn: "text",
  }),

  helper.accessor("is_guestAppointment", {
    id: "Guest Appointment",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <UsersIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Guest Appointment
        </Button>
      </div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center">{getGuestAppointmentBadge(getValue())}</div>
    ),
    meta: { label: "Guest Appointment" },
    sortingFn: "text",
  }),

  helper.accessor("engineer_status", {
    id: "Engineer Status",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <UserCheckIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Engineer Status
        </Button>
      </div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center">
        <EngineerStatus status={getValue()} />
      </div>
    ),
    meta: { label: "Engineer Status" },
    sortingFn: "text",
  }),

  helper.accessor("status", {
    id: "WO Status",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <CheckCircle2Icon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          WO Status
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue();
      if (!val || val === "—")
        return <div className="text-center text-xs text-muted-foreground">—</div>;
      return (
        <div className="flex justify-center items-center">
          <WorkOrderStatus status={val} />
        </div>
      );
    },
    meta: { label: "WO Status" },
    sortingFn: "text",
  }),
]);

export default EngineerTaskColumns;
