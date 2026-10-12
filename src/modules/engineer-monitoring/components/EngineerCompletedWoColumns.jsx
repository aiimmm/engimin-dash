"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Building2Icon,
  CoinsIcon,
  TagIcon,
  UserCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

const helper = createColumnHelper();

export const EngineerCompletedWoColumns = helper.columns([
  helper.accessor("woNumber", {
    id: "WO & Note",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <WrenchIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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

  helper.accessor("engineer", {
    id: "Engineer",
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
      const name = getValue() || "UNASSIGNED";
      return <span className="font-semibold text-xs">{toTitleCase(name)}</span>;
    },
    meta: { label: "Engineer Name" },
    sortingFn: "text",
  }),

  helper.accessor("completedUser", {
    id: "Completed User",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <UsersIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Completed User
      </Button>
    ),
    cell: ({ getValue }) => {
      const user = getValue();
      if (!user || user === "—" || user === "-") {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return <span className="text-xs font-medium">{toTitleCase(user)}</span>;
    },
    meta: { label: "Completed User" },
    sortingFn: "text",
  }),

  helper.accessor("chargeTo", {
    id: "Charge To",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs sm:text-sm px-0 font-semibold"
      >
        <TagIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Charge To
      </Button>
    ),
    cell: ({ getValue }) => {
      const charge = getValue();
      if (!charge || charge === "—" || charge === "-") {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        // <div className="flex justify-center">
        <Badge variant="outline" className="text-xs capitalize font-medium">
          {toTitleCase(charge)}
        </Badge>
        // </div>
      );
    },
    meta: { label: "Charge To" },
    sortingFn: "text",
  }),

  helper.accessor("ctoPrice", {
    id: "Total CTO",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <CoinsIcon className="mr-1.5 h-3.5 w-3.5" />
          Total CTO
        </Button>
      </div>
    ),
    cell: ({ getValue, row }) => {
      const price = getValue() ?? 0;
      const ctoCount =
        row.original.ctoLength || (row.original.ctoList ? row.original.ctoList.length : 0);
      return (
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Badge
            className={
              price > 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold font-mono text-xs"
                : "bg-muted text-muted-foreground text-xs"
            }
          >
            {formatCurrency(price)}
          </Badge>
          {ctoCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {ctoCount} item{ctoCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      );
    },
    meta: { label: "Total CTO" },
    sortingFn: "basic",
  }),

  helper.accessor("department", {
    id: "Department In Charge",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm px-0 font-semibold mx-auto"
        >
          <Building2Icon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Department In Charge
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const dept = getValue();
      if (!dept || dept === "—" || dept === "-") {
        return <div className="text-center text-xs text-muted-foreground">—</div>;
      }
      return <div className="text-center text-xs font-medium capitalize">{toTitleCase(dept)}</div>;
    },
    meta: { label: "Department In Charge" },
    sortingFn: "text",
  }),
]);

export default EngineerCompletedWoColumns;
