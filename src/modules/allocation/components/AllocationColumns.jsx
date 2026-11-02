import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import { getTaskTrackingStatus, isTaskDoneByAdmin } from "@/modules/allocation/lib/reports";
import {
  BedDoubleIcon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Tag01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  WrenchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createColumnHelper } from "@tanstack/react-table";

const helper = createColumnHelper();

function formatActionDate(rawDate) {
  if (!rawDate || rawDate === "—" || rawDate === "-") return "—";
  const str = String(rawDate).trim();
  const customMatch = str.match(/(?:[A-Za-z]+,\s*)?(\d{2})-(\d{2})-(\d{2,4})\s+(\d{2}:\d{2})/);
  if (customMatch) {
    const [, d, m, y, time] = customMatch;
    const fullYear = y.length === 2 ? `20${y}` : y;
    return `${fullYear}-${m}-${d} — ${time}`;
  }
  if (str.length >= 10 && str.includes("-")) {
    const datePart = str.substring(0, 10);
    const timePart = str.length >= 16 ? str.substring(11, 16) : "00:00";
    return `${datePart} — ${timePart}`;
  }
  return str;
}

export const AllocationColumns = helper.columns([
  helper.accessor("wo_no", {
    id: "WO & Note",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <HugeiconsIcon icon={WrenchIcon} className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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
    meta: { label: "WO No & Note" },
    sortingFn: "alphanumeric",
  }),

  helper.accessor("action_date", {
    id: "Action Date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <HugeiconsIcon icon={Calendar01Icon} className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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

  helper.accessor("engineer_1", {
    id: "Engineer Name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <HugeiconsIcon
          icon={UserCheck01Icon}
          className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"
        />
        Engineer Name
      </Button>
    ),
    cell: ({ getValue }) => {
      const value = getValue() || "";
      const isUnassigned = !value || String(value).toUpperCase().includes("UNASSIGNED");
      return (
        <div className="flex justify-center">
          <span
            className={`text-xs font-semibold uppercase ${
              isUnassigned ? "text-red-600 dark:text-red-400" : "text-foreground"
            }`}
          >
            {value || "UNASSIGNED"}
          </span>
        </div>
      );
    },
    meta: { label: "Engineer Name" },
    sortingFn: "text",
  }),

  helper.accessor(
    (row) =>
      `${row.roomcode || ""} — ${row.towername || ""} — ${row.roomnumber || row.roomname || ""}`,
    {
      id: "GenID — Tower — Room",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold"
        >
          <HugeiconsIcon
            icon={BedDoubleIcon}
            className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"
          />
          GenID — Tower — Room
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-44">
          <Typography as="p" className="font-medium text-xs mb-1 italic">
            GenID: {row.original.roomcode || "—"}
          </Typography>
          <Typography as="p" className="font-medium text-xs">
            {row.original.towername || "—"}
          </Typography>
          <Typography
            as="p"
            className="mt-0.75 flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <HugeiconsIcon icon={BedDoubleIcon} className="size-3" />
            {row.original.roomnumber || row.original.roomname || "—"}
          </Typography>
        </div>
      ),
      meta: { label: "GenID — Tower — Room" },
      sortingFn: "text",
    },
  ),

  helper.accessor((row) => `${row.subtype || ""} - ${row.articles || ""}`, {
    id: "Category / Article",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <HugeiconsIcon icon={Tag01Icon} className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Category / Article
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold">{row.original.subtype || "WO"}</span>
        <span className="text-[11px] text-muted-foreground">{row.original.articles || "—"}</span>
      </div>
    ),
    meta: { label: "Category / Article" },
    sortingFn: "text",
  }),

  helper.accessor("roomStatusName", {
    id: "In-House Status",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <BedDoubleIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          In-House Status
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const status = String(getValue() || "").toLowerCase();
      const isInHouse = status.includes("occupied");
      const isVacant = status.includes("vacant");
      const label = isInHouse ? "In-House" : isVacant ? "Non In-House" : "Non In-House";

      return (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Badge
            variant={isInHouse ? "default" : "outline"}
            className={`text-xs ${
              isInHouse ? "bg-amber-500 text-white hover:bg-amber-600" : "text-muted-foreground"
            }`}
          >
            {label}
          </Badge>
          {getValue() && <span className="text-[10px] text-muted-foreground">{getValue()}</span>}
        </div>
      );
    },
    meta: { label: "In-House Status" },
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
          <HugeiconsIcon
            icon={UserGroupIcon}
            className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"
          />
          Guest Appointment
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue();
      const isYes = String(val).toLowerCase() === "yes" || val === 1 || val === true;
      return (
        <div className="flex justify-center items-center">
          {isYes ? (
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
              Yes
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground text-xs">No</Badge>
          )}
        </div>
      );
    },
    meta: { label: "Guest Appointment" },
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
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="mr-1.5 h-3.5 w-3.5 text-muted-foreground"
          />
          WO Status
        </Button>
      </div>
    ),
    cell: ({ getValue, row }) => {
      const val = getValue() || "New";
      const tracking = getTaskTrackingStatus(row.original);
      const isDoneByAdmin = isTaskDoneByAdmin(row.original);

      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <Badge variant="outline" className="text-xs capitalize font-medium">
            {toTitleCase(val)}
          </Badge>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {tracking.status === "Rejected WO Guarantee" ? (
              <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] px-1.5 py-0 border border-red-200 dark:border-red-800">
                Rejected Guarantee
              </Badge>
            ) : tracking.status === "Rejected" ? (
              <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] px-1.5 py-0 border border-red-200 dark:border-red-800">
                Rejected
              </Badge>
            ) : tracking.status === "Completed" ? (
              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] px-1.5 py-0">
                Done by Eng
              </Badge>
            ) : tracking.status === "Arrived" ? (
              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] px-1.5 py-0">
                Arrived
              </Badge>
            ) : tracking.status === "Pending" ? (
              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] px-1.5 py-0">
                Pending
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                New
              </Badge>
            )}
            {isDoneByAdmin && (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                Done by Admin
              </Badge>
            )}
          </div>
        </div>
      );
    },
    meta: { label: "WO Status" },
    sortingFn: "text",
  }),
]);
