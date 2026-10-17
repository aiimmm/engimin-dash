import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  ArrowDataTransferHorizontalIcon,
  BrushCleaningIcon,
  Building02Icon,
  ComplaintIcon,
  CustomerService01Icon,
  GearsIcon,
  LicenseMaintenanceIcon,
  ShoppingCart01Icon,
  StoreManagement01Icon,
  Summation01Icon,
} from "@hugeicons/core-free-icons";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatsCard
        label="Total Work Orders"
        value={safeStats.Total}
        helperText="All departments"
        icon={Summation01Icon}
      />

      <StatsCard
        label="Engineering"
        value={safeStats.Engineering}
        helperText="Engineering department"
        icon={GearsIcon}
      />

      <StatsCard
        label="ORM"
        value={safeStats.ORM}
        helperText="ORM department"
        icon={Building02Icon}
      />

      <StatsCard
        label="Operational"
        value={safeStats.Operational}
        helperText="Operations department"
        icon={BrushCleaningIcon}
      />

      <StatsCard
        label="DIC CS"
        value={safeStats.CS}
        helperText="Customer service"
        icon={CustomerService01Icon}
      />

      <StatsCard
        label="Traveliomart"
        value={safeStats.Traveliomart}
        helperText="Traveliomart department"
        icon={ShoppingCart01Icon}
      />

      <StatsCard
        label="Technical Auditor"
        value={safeStats.TechnicalAuditor}
        helperText="Technical audit"
        icon={LicenseMaintenanceIcon}
      />

      <StatsCard
        label="Admin Inventory"
        value={safeStats.AdminInventory}
        helperText="Inventory administration"
        icon={StoreManagement01Icon}
      />

      <StatsCard
        label="Unassigned"
        value={safeStats.Unassigned}
        helperText="No department assigned"
        icon={ComplaintIcon}
      />

      <StatsCard
        label="Minor Status"
        value={safeStats.Minor}
        helperText="Minor room status"
        icon={ArrowBigDownDashIcon}
      />

      <StatsCard
        label="Major Status"
        value={safeStats.Major}
        helperText="Major room status"
        icon={ArrowBigUpDashIcon}
      />

      <StatsCard
        label="No Room Status"
        value={safeStats.NoRoomStatus}
        helperText="Status not specified"
        icon={ArrowDataTransferHorizontalIcon}
      />
    </div>
  );
};

export const CreatedTodayStats = CreatedDatesStats;
