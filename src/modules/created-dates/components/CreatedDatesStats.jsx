import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  AlertTriangleIcon,
  Building2Icon,
  ClipboardListIcon,
  CogIcon,
  HeadphonesIcon,
  HelpCircleIcon,
  InfoIcon,
  MinusCircleIcon,
  PackageIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  WrenchIcon,
} from "lucide-react";

export const CreatedDatesStats = ({ stats }) => {
  const safeStats = stats || {
    Total: 0,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
    Engineering: 0,
    ORM: 0,
    Traveliomart: 0,
    CS: 0,
    Operational: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatsCard
        label="Total"
        value={safeStats.Total}
        helperText="All Work Orders"
        icon={ClipboardListIcon}
      />

      <StatsCard
        label="Engineering"
        value={safeStats.Engineering}
        helperText="Total Work Orders Engineering Dept"
        icon={WrenchIcon}
      />
      <StatsCard
        label="ORM"
        value={safeStats.ORM}
        helperText="Total Work Orders ORM Dept"
        icon={Building2Icon}
      />
      <StatsCard
        label="Operational"
        value={safeStats.Operational}
        helperText="Total Work Orders Operational Dept"
        icon={CogIcon}
      />
      <StatsCard
        label="DIC CS"
        value={safeStats.CS}
        helperText="Total Work Orders CS Dept"
        icon={HeadphonesIcon}
      />
      <StatsCard
        label="Traveliomart"
        value={safeStats.Traveliomart}
        helperText="Total Work Orders Traveliomart Dept"
        icon={ShoppingBagIcon}
      />

      <StatsCard
        label="Technical Auditor"
        value={safeStats.TechnicalAuditor}
        helperText="Total Work Orders Technical Auditor Dept"
        icon={ShieldCheckIcon}
      />
      <StatsCard
        label="Admin Inventory"
        value={safeStats.AdminInventory}
        helperText="Total Work Orders Admin Inventory Dept"
        icon={PackageIcon}
      />
      <StatsCard
        label="Unassigned"
        value={safeStats.Unassigned}
        helperText="Total Work Orders Unassigned"
        icon={HelpCircleIcon}
      />
      <StatsCard
        label="Status: Minor"
        value={safeStats.Minor}
        helperText="Total Work Orders with Minor Room Status"
        icon={InfoIcon}
      />
      <StatsCard
        label="Status: Major"
        value={safeStats.Major}
        helperText="Total Work Orders with Major Room Status"
        icon={AlertTriangleIcon}
      />
      <StatsCard
        label="Status: -"
        value={safeStats.NoRoomStatus}
        helperText="Total Work Orders with No Room Status"
        icon={MinusCircleIcon}
      />
    </div>
  );
};

export const CreatedTodayStats = CreatedDatesStats;
