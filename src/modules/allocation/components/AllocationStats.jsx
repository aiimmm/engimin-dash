import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import { ArrowRightLeftIcon, ClipboardListIcon, ClockIcon } from "lucide-react";

export const AllocationStats = ({ rows = [], selectedClusters = [] }) => {
  const clusterHelperText = selectedClusters.length > 0 ? "Selected clusters" : "All clusters";
  const total = rows.length;

  const newCount = rows.filter((row) => {
    const s = String(row.woStatus || row.status || "")
      .toLowerCase()
      .trim();
    return s === "new" || s === "1" || s === "new work order";
  }).length;

  const onProgressCount = rows.filter((row) => {
    const s = String(row.woStatus || row.status || "")
      .toLowerCase()
      .trim();
    return (
      s === "on progress" || s === "active" || s === "2" || s === "in progress" || s === "progress"
    );
  }).length;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <StatsCard
        label="Total Allocation"
        value={total}
        helperText={clusterHelperText}
        icon={ClipboardListIcon}
      />
      <StatsCard label="New" value={newCount} helperText="Total WO Status New" icon={ClockIcon} />
      <StatsCard
        label="On Progress"
        value={onProgressCount}
        helperText="Total WO Status On Progress"
        icon={ArrowRightLeftIcon}
      />
    </div>
  );
};
