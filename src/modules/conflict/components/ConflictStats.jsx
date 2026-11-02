import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  Alert02Icon,
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  BedDoubleIcon,
  Building03Icon,
  CustomerService01Icon,
  HelpCircleIcon,
  PackageIcon,
  Settings01Icon,
  ShieldCheckIcon,
  ShoppingBag01Icon,
  WrenchIcon,
} from "@hugeicons/core-free-icons";

export const ConflictStats = ({ stats }) => {
  const safeStats = stats || {
    Total: 0,
    TotalUnit: 0,
    Minor: 0,
    Major: 0,
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
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatsCard
        label="Total Conflict"
        value={safeStats.Total}
        helperText="All conflicting work orders"
        icon={Alert02Icon}
      />
      <StatsCard
        label="Total Unit"
        value={safeStats.TotalUnit}
        helperText="Unique units (GenID)"
        icon={BedDoubleIcon}
      />
      <StatsCard
        label="Minor"
        value={safeStats.Minor}
        helperText="Room status minor"
        icon={ArrowBigDownDashIcon}
      />
      <StatsCard
        label="Major"
        value={safeStats.Major}
        helperText="Room status major"
        icon={ArrowBigUpDashIcon}
      />
      <StatsCard
        label="Engineering"
        value={safeStats.Engineering}
        helperText="Engineering work orders"
        icon={WrenchIcon}
      />
      <StatsCard
        label="Operational"
        value={safeStats.Operational}
        helperText="Operational work orders"
        icon={Settings01Icon}
      />
      <StatsCard
        label="Traveliomart"
        value={safeStats.Traveliomart}
        helperText="Traveliomart work orders"
        icon={ShoppingBag01Icon}
      />
      <StatsCard
        label="Admin Inventory"
        value={safeStats.AdminInventory}
        helperText="Admin Inventory work orders"
        icon={PackageIcon}
      />
      <StatsCard
        label="ORM"
        value={safeStats.ORM}
        helperText="ORM work orders"
        icon={Building03Icon}
      />
      <StatsCard
        label="CS"
        value={safeStats.CS}
        helperText="Customer Service work orders"
        icon={CustomerService01Icon}
      />
      <StatsCard
        label="Technical Auditor"
        value={safeStats.TechnicalAuditor}
        helperText="Technical audit work orders"
        icon={ShieldCheckIcon}
      />
      <StatsCard
        label="Unassigned"
        value={safeStats.Unassigned}
        helperText="Unassigned work orders"
        icon={HelpCircleIcon}
      />
    </div>
  );
};
