import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  ApartmentIcon,
  CalendarCheckIn01Icon,
  UserCheck01Icon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons";

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
        label="Total Appointments"
        value={rows.length}
        helperText="All work order appointments"
        icon={CalendarCheckIn01Icon}
      />
      <StatsCard
        label="Total Units"
        value={unitCount}
        helperText="Unique units by GenID"
        icon={ApartmentIcon}
      />
      <StatsCard
        label="Assigned"
        value={assignCount}
        helperText="With assigned engineers"
        icon={UserCheck01Icon}
      />
      <StatsCard
        label="Unassigned"
        value={unassignCount}
        helperText="Without assigned engineers"
        icon={UserSearch01Icon}
      />
    </div>
  );
};
