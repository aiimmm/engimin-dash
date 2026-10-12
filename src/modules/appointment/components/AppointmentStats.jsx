import { CheckCircle2Icon, CircleDotIcon, ClipboardListIcon } from "lucide-react";
import { StatsCard } from "@/modules/shared/components/DashboardComponents";

export const AppointmentStats = ({ rows, stats }) => {
  const unitCount = new Set(rows.map((row) => row.latestReservation?.genId).filter(Boolean)).size;

  const unassignCount = rows.filter((row) =>
    String(row.engineer || "")
      .toUpperCase()
      .includes("UNASSIGNED"),
  ).length;

  const assignCount = rows.length - unassignCount;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        label="Total"
        value={rows.length}
        helperText="All data loaded"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Unit"
        value={unitCount}
        helperText="Total Units by GenID"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Assign"
        value={assignCount}
        helperText="Total Engineers Assigned"
        icon={CircleDotIcon}
      />
      <StatsCard
        label="Unassign"
        value={unassignCount}
        helperText="Total Engineers Unassigned"
        icon={CheckCircle2Icon}
      />
    </div>
  );
};
