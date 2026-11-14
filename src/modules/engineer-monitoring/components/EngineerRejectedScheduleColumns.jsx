"use client";

import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { getWorkOrderTracingUrl, toTitleCase } from "@/lib/utils";
import {
  ApartmentIcon,
  BedDoubleIcon,
  Calendar03Icon,
  NotebookPenIcon,
  NoteIcon,
  TagsIcon,
  UserIcon,
  UserSettings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createColumnHelper } from "@tanstack/react-table";

// ============================================================================
// CONSTANTS
// ============================================================================
const EMPTY = "—";
const BLANK_NOTE_VALUES = ["-", EMPTY, "null", "none"];

/** Log otomatis sistem yang bukan catatan manual dari admin. */
const SYSTEM_EVENT_PATTERNS = [
  /^create wo/i,
  /^extend wo/i,
  /^schedule wo .* (rejected|completed|approved) by/i,
  /^assign to/i,
  /^reassign to/i,
  /^status changed/i,
  /^auto close/i,
  /melakukan pending workorder dengan alasan/i,
];
const REJECT_REMARK_TAG = /\[remark for wo rejected\]/i;
const REJECTED_BY_REGEX = /rejected by\s+([^.\n\r]+)/i;

// ============================================================================
// GENERIC HELPERS
// ============================================================================
const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isFilled = (value) => {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return text !== "" && text !== EMPTY;
};

// ============================================================================
// TASK FIELD ACCESSORS
// ============================================================================
const getEngineerName = (task) => task.fullname || task.engineer || task.currentEngineerName || "";
const getCompletedUser = (task) => task.completed_user || task.completedUser || null;
const getTaskReason = (task) => task.reason || task.remark || task.note || "";
const getTaskDetail = (task) => {
  if (Array.isArray(task.detail)) return task.detail;
  if (Array.isArray(task.details)) return task.details;
  return [];
};

const getCluster = (row) => row.cluster || row.cluster_name || "";
const getUnit = (row) =>
  row.unit ||
  (row.towerName ? `${row.towerName} - ${row.roomName}` : row.roomName) ||
  row.roomCode ||
  "";
const getArticle = (row) => row.article || row.wo_articles || row.wo_subtype || row.wo_type || "";

// ============================================================================
// HELPER: Extract pure WO number (preferring "WO-" codes over numeric database IDs)
// ============================================================================
export function getTaskWoNumber(task = {}) {
  if (!task) return EMPTY;

  const candidates = [task.wo_no, task.woNumber, task.number, task.code, task.id];
  const strings = candidates.filter((c) => typeof c === "string" && c.trim());

  const woCode = strings.find((c) => c.trim().toUpperCase().startsWith("WO"));
  const nonNumeric = strings.find((c) => !/^\d+$/.test(c.trim()) && c.trim() !== EMPTY);
  const anyValue = candidates.find(isFilled);

  const match = woCode ?? nonNumeric ?? anyValue;
  return match !== undefined ? String(match).trim() : EMPTY;
}

// ============================================================================
// HELPER: Extract latest note from admin who completed / rejected the schedule
// Searches backwards in detail log for the admin note, skipping system logs
// ============================================================================
const isBlankNote = (text) => BLANK_NOTE_VALUES.includes(normalize(text));
const isSystemEvent = (text) => SYSTEM_EVENT_PATTERNS.some((pattern) => pattern.test(text));
const isSystemLog = (text) => {
  const value = String(text || "").trim();
  return isBlankNote(value) || isSystemEvent(value) || REJECT_REMARK_TAG.test(value);
};

/** Ambil catatan manual dari satu item detail, atau "" kalau itu log sistem. */
const getCleanItemNote = (item) => {
  const remark = String(item.remark || "").trim();
  const housekeepingNotes = String(item.housekeeping_notes || "").trim();

  if (isSystemEvent(remark)) return "";
  if (housekeepingNotes && !isSystemLog(housekeepingNotes)) return housekeepingNotes;
  if (remark && !isSystemLog(remark)) return remark;
  return "";
};

/** Akun engineer / vendor / engineer yang sedang ditugaskan (bukan admin). */
const isEngineerAccount = (userName, engineerName) => {
  const user = normalize(userName);
  const engineer = normalize(engineerName);

  return (
    !user ||
    user.endsWith(".eng") ||
    user.startsWith("v-") ||
    user.startsWith("vnd ") ||
    user.includes("vendor") ||
    Boolean(engineer && (user.includes(engineer) || engineer.includes(user)))
  );
};

/** Cari nama admin yang me-reject / complete jadwal, dari log paling baru. */
const findRejectingAdmin = (detail) => {
  for (const item of [...detail].reverse()) {
    const rejectMatch = String(item.remark || "")
      .trim()
      .match(REJECTED_BY_REGEX);
    if (rejectMatch) return rejectMatch[1].trim();

    const isCompleted =
      item.isComplete === 1 || String(item.status || "").toUpperCase() === "COMPLETE";
    const hasAdminCreator =
      item.created_user && !String(item.created_user).toLowerCase().endsWith(".eng");
    if (isCompleted && hasAdminCreator) return String(item.created_user).trim();
  }
  return null;
};

export function extractAdminCompletedNote(task = {}) {
  // Sudah dihitung oleh route handler
  if (task.admin_completed_note) {
    return {
      id: null,
      note: task.admin_completed_note,
      admin: task.admin_completed_user || "Admin",
      date: task.admin_completed_date || "",
    };
  }

  const fallbackNote = getTaskReason(task) || EMPTY;
  const detail = getTaskDetail(task);

  if (detail.length === 0) {
    return { id: null, note: fallbackNote, admin: getCompletedUser(task), date: null };
  }

  const rejectingAdmin = findRejectingAdmin(detail);
  const engineerName = getEngineerName(task);

  // Cari catatan manual terbaru dari non-engineer
  for (const item of [...detail].reverse()) {
    const createdUser = String(item.created_user || item.updated_user || "").trim();
    const note = getCleanItemNote(item);

    if (note && !isEngineerAccount(createdUser, engineerName)) {
      return {
        id: item.id,
        note,
        admin: createdUser || rejectingAdmin || "Admin",
        date: item.update_time || item.created_date || item.updated_date || "",
      };
    }
  }

  return {
    id: null,
    note: fallbackNote,
    admin: rejectingAdmin || getCompletedUser(task),
    date: null,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================
/** "2026-11-12 20:41:00" -> "12/11/2026, 20:41" */
const formatAdminDate = (date) => {
  if (!date || typeof date !== "string") return "";
  if (!date.includes(" ")) return date;

  const [datePart, timePart] = date.split(" ");
  const [year, month, day] = datePart.split("-");
  const time = timePart ? timePart.slice(0, 5) : "";
  return `${day}/${month}/${year}${time ? `, ${time}` : ""}`;
};

// ============================================================================
// SMALL COMPONENTS
// ============================================================================
function SortableHeader({ column, icon, children }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="px-0 text-xs font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
    >
      <HugeiconsIcon icon={icon} className="mr-0.5 size-4 text-muted-foreground" />
      {children}
    </Button>
  );
}

function WoNumber({ woNumber, href }) {
  const selectText = (event) => {
    event.preventDefault();
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(event.currentTarget);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const openTracing = (event) => {
    event.preventDefault();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <span
      onClick={selectText}
      onDoubleClick={openTracing}
      className="cursor-pointer select-text text-xs font-mono font-medium hover:underline"
      title="Klik untuk select, double click untuk membuka"
    >
      {woNumber}
    </span>
  );
}

function AdminNoteCell({ task }) {
  const { note, admin, date } = extractAdminCompletedNote(task);
  const hasNote = note && note !== EMPTY;

  if (!hasNote) {
    const reason = getTaskReason(task);
    return (
      <p
        className="max-w-xs text-sm text-muted-foreground whitespace-normal line-clamp-2"
        title={reason}
      >
        {reason || <span className="italic">Tidak ada note</span>}
      </p>
    );
  }

  const formattedDate = formatAdminDate(date);

  return (
    <div className="w-full min-w-55 max-w-sm space-y-1">
      <p
        className="text-xs capitalize leading-relaxed text-foreground whitespace-normal wrap-break-word line-clamp-4"
        title={note}
      >
        &ldquo;{note}&rdquo;
      </p>

      {(admin || formattedDate) && (
        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
          {admin && (
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={UserIcon} className="size-3 shrink-0" />
              <span className="truncate">{admin}</span>
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1.5 tabular-nums">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3 shrink-0" />
              {formattedDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COLUMNS
// ============================================================================
const helper = createColumnHelper();

export const EngineerRejectedScheduleColumns = helper.columns([
  // --------------------------------------------------------------- WO & Note
  helper.accessor("woNumber", {
    id: "WO & Note",
    header: ({ column }) => (
      <SortableHeader column={column} icon={NoteIcon}>
        WO No & Note
      </SortableHeader>
    ),
    cell: ({ getValue, row }) => {
      const task = row.original;
      const woNumber = getValue() || task.id || EMPTY;
      const status = String(task.woStatus || task.status || "");
      const href = getWorkOrderTracingUrl(woNumber, status);
      const note = task.remark || task.note || EMPTY;

      return (
        <div className="w-full max-w-sm space-y-0.5">
          <div>
            <WoNumber woNumber={woNumber} href={href} />
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

  // ---------------------------------------------------------------- Engineer
  helper.accessor((row) => getEngineerName(row) || "UNASSIGNED", {
    id: "engineer",
    header: ({ column }) => (
      <SortableHeader column={column} icon={UserSettings01Icon}>
        Engineer
      </SortableHeader>
    ),
    cell: ({ getValue, row }) => {
      const name = getValue();
      const isVendor =
        row.original.user_type === "vendor_engineer" ||
        String(name).toLowerCase().includes("vendor");

      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-foreground">{toTitleCase(name)}</div>
          <span className="text-[10px] text-muted-foreground">
            {isVendor ? "Vendor" : "Internal"}
          </span>
        </div>
      );
    },
    meta: { label: "Engineer" },
    sortingFn: "text",
  }),

  // ------------------------------------------------------------ Cluster & Unit
  helper.accessor((row) => `${getCluster(row)} ${getUnit(row)} ${row.roomCode || ""}`.trim(), {
    id: "clusterUnit",
    header: ({ column }) => (
      <SortableHeader column={column} icon={ApartmentIcon}>
        Cluster & Unit
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const task = row.original;

      return (
        <div className="min-w-44 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
            <HugeiconsIcon icon={ApartmentIcon} className="size-3 shrink-0" />
            <span className="truncate">{getCluster(task) || EMPTY}</span>
          </div>
          <Typography as="p" className="text-xs font-medium italic">
            GenID: {task.roomCode || EMPTY}
          </Typography>
          <Typography as="p" className="text-xs font-medium">
            {task.towerName}
          </Typography>
          <Typography as="p" className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <HugeiconsIcon icon={BedDoubleIcon} className="size-3 text-muted-foreground" />
            {task.roomName || EMPTY}
          </Typography>
        </div>
      );
    },
    meta: { label: "Cluster & Unit" },
    sortingFn: "text",
  }),

  // --------------------------------------------------------- Article / Subtype
  helper.accessor((row) => `${getArticle(row)} ${row.wo_type || ""}`.trim(), {
    id: "article",
    header: ({ column }) => (
      <SortableHeader column={column} icon={TagsIcon}>
        Article / Subtype
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const task = row.original;
      const article = getArticle(task) || EMPTY;

      return (
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-foreground truncate" title={article}>
            {article}
          </div>
          {task.wo_type && (
            <span className="text-[10px] text-muted-foreground">{task.wo_type}</span>
          )}
        </div>
      );
    },
    meta: { label: "Article / Subtype" },
    sortingFn: "text",
  }),

  // ------------------------------------------------------ Note Admin Completed
  helper.accessor(
    (row) => {
      const { note, admin } = extractAdminCompletedNote(row);
      return `${note || ""} ${admin || ""} ${getTaskReason(row)}`.trim();
    },
    {
      id: "adminNote",
      header: () => (
        <div className="flex items-center gap-1.5 text-xs font-semibold capitalize">
          <HugeiconsIcon icon={NotebookPenIcon} className="size-3.5 text-muted-foreground" />
          Note Admin Completed
        </div>
      ),
      cell: ({ row }) => <AdminNoteCell task={row.original} />,
      meta: { label: "Note Admin Completed" },
      sortingFn: "text",
    },
  ),
]);

export default EngineerRejectedScheduleColumns;
