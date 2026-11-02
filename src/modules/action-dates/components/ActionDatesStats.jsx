import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import { ClipboardListIcon, Clock01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export const ActionDatesStats = ({ rows = [], selectedClusters = [] }) => {
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
        label="Total Action Date"
        value={total}
        helperText={clusterHelperText}
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="New"
        value={newCount}
        helperText="Total WO Status New"
        icon={InformationCircleIcon}
      />
      <StatsCard
        label="On Progress"
        value={onProgressCount}
        helperText="Total WO Status On Progress"
        icon={Clock01Icon}
      />
    </div>
  );
};
