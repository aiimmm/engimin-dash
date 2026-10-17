import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import {
  CloseOutStatus,
  RoomStatus,
  WorkOrderStatus,
} from "@/modules/shared/components/DashboardComponents";
import {
  ApartmentIcon,
  AppleReminderIcon,
  BedDoubleIcon,
  CalendarCheckIn01Icon,
  CalendarCheckOut01Icon,
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

export const ActionDatesColumns = helper.columns([
  helper.display({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className="size-4 rounded border-input accent-primary cursor-pointer align-middle"
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className="size-4 rounded border-input accent-primary cursor-pointer align-middle"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  helper.accessor("woNumber", {
    id: "WO & Note",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold"
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
            className="select-none whitespace-normal text-[10px] text-muted-foreground line-clamp-3"
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
        className="text-xs px-0 font-semibold"
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
            BookID: {row.original.roomCode}
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
  helper.accessor("otaBookNumber", {
    id: "Future Reservation",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold"
      >
        <HugeiconsIcon
          icon={CalendarCheckIn01Icon}
          className="mr-0.5 size-4 text-muted-foreground"
        />
        Future Reservation
      </Button>
    ),
    cell: ({ row }) => {
      const otaBookNumber = row.original.otaBookNumber;
      const ciDate = row.original.ciDate;
      const coDate = row.original.coDate;

      if (!otaBookNumber || otaBookNumber === "—") {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      return (
        <div className="min-w-32">
          <Typography as="p" className="font-medium text-xs mb-1 italic">
            BookID: {otaBookNumber}
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

  helper.accessor((row) => `${row.roomCode} — ${row.towerName} — ${row.roomName}`, {
    id: "property",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 text-xs font-semibold"
      >
        <HugeiconsIcon icon={ApartmentIcon} className="mr-0.5 size-4 text-muted-foreground" />
        GenID — Tower — Room
      </Button>
    ),
    cell: ({ row }) => {
      const data = row.original;
      const isBreak = Boolean(data.isBreakContract);

      const breakDate = data.breakContractDate || data.breakcontract_date;

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

          {/* <div className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="text-muted-foreground">Break Contract:</span>
            <Typography
              as="span"
              className={cn(
                "text-[10px]",
                isBreak ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
              )}
            >
              {isBreak ? (breakDate && breakDate !== true ? fmtDate(breakDate) : "Yes") : "No"}
            </Typography>
          </div> */}

          {isBreak && (
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              <span className="text-red-600 dark:text-red-400">Break Contract:</span>

              <Typography
                as="span"
                className="text-[10px] font-medium text-red-600 dark:text-red-400"
              >
                {breakDate && breakDate !== true ? fmtDate(breakDate) : "Yes"}
              </Typography>
            </div>
          )}
        </div>
      );
    },
    meta: { label: "GenID — Tower — Room" },
    sortingFn: "text",
  }),

  helper.accessor(
    (row) => `${row.roomStatus ?? ""} ${row.isIncludeCloseOut ?? ""} ${row.woStatus ?? ""}`,
    {
      id: "WO Status",
      header: ({ column }) => (
        <div className="flex w-full justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="mx-auto px-0 text-xs font-semibold"
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

  // helper.accessor("roomStatus", {
  //   id: "Room Status",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs sm:text-sm px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon
  //           icon={AppleReminderIcon}
  //           className="mr-0.5 size-4 text-muted-foreground"
  //         />
  //         Room Status
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ getValue }) => (
  //     <div className="flex justify-center">
  //       <RoomStatus status={getValue()} />
  //     </div>
  //   ),
  //   meta: { label: "Room Status" },
  //   sortingFn: "text",
  // }),
  // helper.accessor("isIncludeCloseOut", {
  //   id: "Close Out Status",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs sm:text-sm px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon icon={ShieldAlertIcon} className="mr-0.5 size-4 text-muted-foreground" />
  //         Close Out Status
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div className="flex justify-center">
  //       <CloseOutStatus isCloseOut={row.original.isIncludeCloseOut} />
  //     </div>
  //   ),
  //   meta: { label: "Close Out Status" },
  //   sortingFn: "basic",
  // }),
  // helper.accessor("woStatus", {
  //   id: "Status WO",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs sm:text-sm px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon
  //           icon={CheckmarkCircle02Icon}
  //           className="mr-0.5 size-4 text-muted-foreground"
  //         />
  //         Status WO
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ getValue }) => (
  //     <div className="flex justify-center">
  //       <WorkOrderStatus status={getValue()} />
  //     </div>
  //   ),
  //   meta: { label: "Status WO" },
  //   sortingFn: "text",
  // }),
  helper.accessor("engineer", {
    id: "Engineer",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs px-0 font-semibold"
      >
        <HugeiconsIcon icon={UserSettings01Icon} className="mr-0.5 size-4 text-muted-foreground" />
        Engineer
      </Button>
    ),
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
        className="text-xs px-0 font-semibold"
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
  // helper.accessor("isWoManageByOwner", {
  //   id: "WO By Owner",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs sm:text-sm px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon icon={FileUserIcon} className="mr-0.5 size-4 text-muted-foreground" />
  //         WO By Owner
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ getValue, row }) => {
  //     const val = getValue();
  //     const rawVal = row.original.wo_manage_by_owner;
  //     const isOwner =
  //       Number(val) === 1 ||
  //       Number(rawVal) === 1 ||
  //       val === "1" ||
  //       rawVal === "1" ||
  //       val === true ||
  //       rawVal === true;

  //     return (
  //       <div className="flex justify-center">
  //         {isOwner ? (
  //           <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
  //             Yes
  //           </Badge>
  //         ) : (
  //           <Badge variant="outline" className="text-muted-foreground">
  //             No
  //           </Badge>
  //         )}
  //       </div>
  //     );
  //   },
  //   meta: { label: "WO By Owner" },
  //   sortingFn: "basic",
  // }),
  // helper.accessor("postChargeListLength", {
  //   id: "Post Charge",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs sm:text-sm px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon
  //           icon={MoneyReceive01Icon}
  //           className="mr-0.5 size-4 text-muted-foreground"
  //         />
  //         Post Charge
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ getValue, row }) => {
  //     const hasPostCharge =
  //       Number(getValue()) > 0 ||
  //       (Array.isArray(row.original.postChargeList) && row.original.postChargeList.length > 0) ||
  //       Number(row.original.post_charge_list_length) > 0 ||
  //       (Array.isArray(row.original.post_charge_list) && row.original.post_charge_list.length > 0);

  //     return (
  //       <div className="flex justify-center">
  //         {hasPostCharge ? (
  //           <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
  //             Yes
  //           </Badge>
  //         ) : (
  //           <Badge variant="outline" className="text-muted-foreground">
  //             No
  //           </Badge>
  //         )}
  //       </div>
  //     );
  //   },
  //   meta: { label: "Post Charge" },
  //   sortingFn: "basic",
  // }),
  // helper.accessor("breakContractDate", {
  //   id: "Break Contract",
  //   header: ({ column }) => (
  //     <div className="flex justify-center w-full">
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //         className="text-xs px-0 font-semibold mx-auto"
  //       >
  //         <HugeiconsIcon icon={ContractsIcon} className="mr-0.5 size-4 text-muted-foreground" />
  //         Break Contract
  //       </Button>
  //     </div>
  //   ),
  //   cell: ({ getValue, row }) => {
  //     const isBreak = Boolean(row.original.isBreakContract);
  //     const dateVal =
  //       getValue() || row.original.breakcontract_date || row.original.breakContractDate;

  //     return (
  //       <div className="flex justify-center">
  //         {isBreak ? (
  //           <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
  //             {dateVal && dateVal !== true ? fmtDate(dateVal) : "Yes"}
  //           </Badge>
  //         ) : (
  //           <Badge variant="outline" className="text-muted-foreground">
  //             No
  //           </Badge>
  //         )}
  //       </div>
  //     );
  //   },
  //   meta: { label: "Break Contract" },
  //   sortingFn: "basic",
  // }),
]);
