"use client";

import { usePendingToast } from "@/hooks/usePendingToast";
import WelcomeCard from "./WelcomeCard";

export const DashboardModules = ({ user }) => {
  usePendingToast();

  return (
    <div className="space-y-6">
      <WelcomeCard user={user} />
    </div>
  );
};

export default DashboardModules;
