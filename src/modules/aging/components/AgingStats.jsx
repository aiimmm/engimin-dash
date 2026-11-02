import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  Alert02Icon,
  Building03Icon,
  ClipboardListIcon,
  Clock01Icon,
  CustomerService01Icon,
  Home07Icon,
  InformationCircleIcon,
  MinusSignCircleIcon,
  PackageIcon,
  Settings01Icon,
  ShieldCheckIcon,
  ShoppingBag01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserRemove01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

export const AgingStats = ({ stats }) => {
  const safeStats = stats || {
    Total: 0,
    TotalUnit: 0,
    Assigned: 0,
    UnassignedEngineer: 0,
    New: 0,
    OnProgress: 0,
    Engineering: 0,
    ORM: 0,
    Operational: 0,
    Traveliomart: 0,
    CS: 0,
    TechnicalAuditor: 0,
    AdminInventory: 0,
    Unassigned: 0,
    Major: 0,
    Minor: 0,
    NoRoomStatus: 0,
  };

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatsCard
        label="Total Aging WO"
        value={safeStats.Total}
        helperText="All aging work orders"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Total Unit"
        value={safeStats.TotalUnit}
        helperText="Unique units (GenID)"
        icon={Home07Icon}
      />
      <StatsCard
        label="Assigned"
        value={safeStats.Assigned}
        helperText="Assigned to engineers"
        icon={UserCheck01Icon}
      />
      <StatsCard
        label="Unassigned"
        value={safeStats.UnassignedEngineer}
        helperText="Awaiting engineer assignment"
        icon={UserRemove01Icon}
      />
      <StatsCard
        label="Engineering"
        value={safeStats.Engineering}
        helperText="Engineering work orders"
        icon={Wrench01Icon}
      />
      <StatsCard
        label="ORM"
        value={safeStats.ORM}
        helperText="ORM work orders"
        icon={Building03Icon}
      />
      <StatsCard
        label="Operational"
        value={safeStats.Operational}
        helperText="Operational work orders"
        icon={Settings01Icon}
      />
      <StatsCard
        label="DIC CS"
        value={safeStats.CS}
        helperText="Customer Service work orders"
        icon={CustomerService01Icon}
      />
      <StatsCard
        label="Traveliomart"
        value={safeStats.Traveliomart}
        helperText="Traveliomart work orders"
        icon={ShoppingBag01Icon}
      />
      <StatsCard
        label="Technical Auditor"
        value={safeStats.TechnicalAuditor}
        helperText="Technical audit work orders"
        icon={ShieldCheckIcon}
      />
      <StatsCard
        label="Admin Inventory"
        value={safeStats.AdminInventory}
        helperText="Inventory work orders"
        icon={PackageIcon}
      />
      <StatsCard
        label="Unassigned DIC"
        value={safeStats.Unassigned}
        helperText="Work orders without a DIC"
        icon={UserGroupIcon}
      />
      <StatsCard
        label="Status: Minor"
        value={safeStats.Minor}
        helperText="Minor room issues"
        icon={InformationCircleIcon}
      />
      <StatsCard
        label="Status: Major"
        value={safeStats.Major}
        helperText="Major room issues"
        icon={Alert02Icon}
      />
      <StatsCard
        label="Status: -"
        value={safeStats.NoRoomStatus}
        helperText="No room status recorded"
        icon={MinusSignCircleIcon}
      />
      <StatsCard
        label="On Progress"
        value={safeStats.OnProgress}
        helperText="Work orders in progress"
        icon={Clock01Icon}
      />
    </div>
  );
};

export default AgingStats;
