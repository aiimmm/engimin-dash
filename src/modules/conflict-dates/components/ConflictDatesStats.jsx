import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  BedDoubleIcon,
  Building2Icon,
  CalendarRangeIcon,
  ClockIcon,
  CogIcon,
  HeadphonesIcon,
  HelpCircleIcon,
  PackageIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  WrenchIcon,
} from "lucide-react";

export const ConflictDatesStats = ({ stats }) => {
  const safeStats = stats || {
    Total: 0,
    TotalUnit: 0,
    New: 0,
    OnProgress: 0,
    Engineering: 0,
    Operational: 0,
    Traveliomart: 0,
    AdminInventory: 0,
    ORM: 0,
    CS: 0,
    TechnicalAuditor: 0,
    Unassigned: 0,
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      <StatsCard
        label="Total Conflict"
        value={safeStats.Total}
        helperText="All Conflict Work Orders"
        icon={CalendarRangeIcon}
      />
      <StatsCard
        label="Total Unit"
        value={safeStats.TotalUnit}
        helperText="Total Unique Units (GenID)"
        icon={BedDoubleIcon}
      />
      <StatsCard
        label="New"
        value={safeStats.New}
        helperText="Total Work Orders with New Status"
        icon={ClockIcon}
      />
      <StatsCard
        label="On Progress"
        value={safeStats.OnProgress}
        helperText="Total Work Orders with On Progress Status"
        icon={PlayCircleIcon}
      />
      <StatsCard
        label="Engineering"
        value={safeStats.Engineering}
        helperText="Total Work Orders Engineering Dept"
        icon={WrenchIcon}
      />
      <StatsCard
        label="Operational"
        value={safeStats.Operational}
        helperText="Total Work Orders Operational Dept"
        icon={CogIcon}
      />
      <StatsCard
        label="Traveliomart"
        value={safeStats.Traveliomart}
        helperText="Total Work Orders Traveliomart Dept"
        icon={ShoppingBagIcon}
      />
      <StatsCard
        label="Admin Inventory"
        value={safeStats.AdminInventory}
        helperText="Total Work Orders Admin Inventory Dept"
        icon={PackageIcon}
      />
      <StatsCard
        label="ORM"
        value={safeStats.ORM}
        helperText="Total Work Orders ORM Dept"
        icon={Building2Icon}
      />
      <StatsCard
        label="CS"
        value={safeStats.CS}
        helperText="Total Work Orders CS Dept"
        icon={HeadphonesIcon}
      />
      <StatsCard
        label="Technical Auditor"
        value={safeStats.TechnicalAuditor}
        helperText="Total Work Orders Technical Auditor Dept"
        icon={ShieldCheckIcon}
      />
      <StatsCard
        label="Unassigned"
        value={safeStats.Unassigned}
        helperText="Total Work Orders Unassigned"
        icon={HelpCircleIcon}
      />
    </div>
  );
};
