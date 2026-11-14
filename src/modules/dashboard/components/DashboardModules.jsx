"use client";

import { usePendingToast } from "@/hooks/usePendingToast";
import { TopRankAdminCompletes } from "@/modules/engineer-monitoring";
import WelcomeCard from "./WelcomeCard";

export const DashboardModules = ({ user }) => {
  usePendingToast();

  return (
    <div className="space-y-6">
      <WelcomeCard user={user} />

      <TopRankAdminCompletes />
    </div>
  );
};

export default DashboardModules;
