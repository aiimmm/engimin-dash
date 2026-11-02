import {
  getInHouseStatus,
  isAppointmentTask,
  isTaskDoneByAdmin,
  isTaskDoneByEng,
} from "@/modules/allocation/lib/reports";
import { StatsCard } from "@/modules/shared/components/DashboardComponents";
import {
  Calendar03Icon,
  ClipboardListIcon,
  HardHatIcon,
  Home06Icon,
  Home07Icon,
  TaskDone01Icon,
  UserCheck01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useMemo } from "react";

export const AllocationStats = ({ rows = [] }) => {
  const stats = useMemo(() => {
    const genIds = new Set();
    const engineers = new Set();
    let inHouse = 0;
    let nonInHouse = 0;
    let guestApptCount = 0;
    let doneByEng = 0;
    let doneByAdmin = 0;

    rows.forEach((row) => {
      const genId = row.roomcode || row.roomCode || row.genId;
      if (genId && genId !== "—" && genId !== "-") {
        genIds.add(genId);
      }

      const eng = String(
        row.engineer_1 || row.engineer || row.currentEngineerName || row.fullname || "",
      ).trim();
      if (eng && eng !== "—" && eng !== "-" && eng.toLowerCase() !== "unassigned") {
        engineers.add(eng.toUpperCase());
      }

      const inHouseStatus = getInHouseStatus(row.roomStatusName || row.roomStatus);
      if (inHouseStatus === "In-House") {
        inHouse++;
      } else {
        nonInHouse++;
      }

      if (isAppointmentTask(row)) {
        guestApptCount++;
      }

      if (isTaskDoneByEng(row)) doneByEng++;
      if (isTaskDoneByAdmin(row)) doneByAdmin++;
    });

    return {
      total: rows.length,
      units: genIds.size,
      engineers: engineers.size,
      inHouse,
      nonInHouse,
      guestApptCount,
      doneByEng,
      doneByAdmin,
    };
  }, [rows]);

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      <StatsCard
        label="Work Orders"
        value={stats.total}
        helperText="All work orders"
        icon={ClipboardListIcon}
      />
      <StatsCard
        label="Units"
        value={stats.units}
        helperText="Unique units by GenID"
        icon={Home07Icon}
      />
      <StatsCard
        label="Engineers"
        value={stats.engineers}
        helperText="Assigned to work orders"
        icon={HardHatIcon}
      />
      <StatsCard
        label="Appointments"
        value={stats.guestApptCount}
        helperText="Guest appointments"
        icon={Calendar03Icon}
      />
      <StatsCard
        label="In-House"
        value={stats.inHouse}
        helperText="Units with guests"
        icon={UserGroupIcon}
      />
      <StatsCard
        label="Non-In-House"
        value={stats.nonInHouse}
        helperText="Vacant units"
        icon={Home06Icon}
      />
      <StatsCard
        label="Eng Completed"
        value={stats.doneByEng}
        helperText="Completed by engineers"
        icon={TaskDone01Icon}
      />
      <StatsCard
        label="Admin Completed"
        value={stats.doneByAdmin}
        helperText="Completed by admin"
        icon={UserCheck01Icon}
      />
    </div>
  );
};
