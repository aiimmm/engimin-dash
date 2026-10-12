"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BedDoubleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ListTodoIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";

const helper = createColumnHelper();

export const EngineerTotalTaskColumns = helper.columns([
  helper.accessor("fullname", {
    id: "Engineer Name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-sm px-0 font-semibold"
      >
        <UserCheckIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Engineer Name
      </Button>
    ),
    cell: ({ getValue }) => {
      const name = getValue() || "—";
      return <span className="font-semibold text-sm">{toTitleCase(name)}</span>;
    },
    meta: { label: "Engineer Name" },
    sortingFn: "text",
  }),

  helper.accessor("total_task", {
    id: "Total Task",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <ListTodoIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Total Task
        </Button>
      </div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center">
        <Badge className="font-semibold text-sm">{getValue() ?? 0}</Badge>
      </div>
    ),
    meta: { label: "Total Task" },
    sortingFn: "basic",
  }),

  helper.accessor("total_unit", {
    id: "Total Unit",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <BedDoubleIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Total Unit
        </Button>
      </div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center">
        <Badge className="font-semibold text-sm">{getValue() ?? 0}</Badge>
      </div>
    ),
    meta: { label: "Total Unit" },
    sortingFn: "basic",
  }),

  helper.accessor("total_uncompleted", {
    id: "Total Uncompleted",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <ClockIcon className="mr-1.5 h-3.5 w-3.5 text-red-500" />
          Total Uncompleted
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue() ?? 0;
      return (
        <div className="flex justify-center items-center">
          <Badge
            className={
              val > 0
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-sm"
                : "bg-muted text-muted-foreground text-sm"
            }
          >
            {val}
          </Badge>
        </div>
      );
    },
    meta: { label: "Total Uncompleted" },
    sortingFn: "basic",
  }),

  helper.accessor("total_unit_completed", {
    id: "Total Unit Completed",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <ShieldCheckIcon className="mr-1.5 h-3.5 w-3.5 text-sky-500" />
          Total Unit Completed
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue() ?? 0;
      return (
        <div className="flex justify-center items-center">
          <Badge
            className={
              val > 0
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-sm"
                : "bg-muted text-muted-foreground text-sm"
            }
          >
            {val}
          </Badge>
        </div>
      );
    },
    meta: { label: "Total Unit Completed" },
    sortingFn: "basic",
  }),

  helper.accessor("total_engineer_completed", {
    id: "Total Engineer Completed",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <UserCheckIcon className="mr-1.5 h-3.5 w-3.5 text-sky-500" />
          Total Engineer Completed
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue() ?? 0;
      return (
        <div className="flex justify-center items-center">
          <Badge
            className={
              val > 0
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-sm"
                : "bg-muted text-muted-foreground text-sm"
            }
          >
            {val}
          </Badge>
        </div>
      );
    },
    meta: { label: "Total Engineer Completed" },
    sortingFn: "basic",
  }),

  helper.accessor("total_completed", {
    id: "Total Completed",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm px-0 font-semibold mx-auto"
        >
          <CheckCircle2Icon className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
          Total Completed
        </Button>
      </div>
    ),
    cell: ({ getValue }) => {
      const val = getValue() ?? 0;
      return (
        <div className="flex justify-center items-center">
          <Badge
            className={
              val > 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-sm"
                : "bg-muted text-muted-foreground text-sm"
            }
          >
            {val}
          </Badge>
        </div>
      );
    },
    meta: { label: "Total Completed" },
    sortingFn: "basic",
  }),
]);

export default EngineerTotalTaskColumns;
