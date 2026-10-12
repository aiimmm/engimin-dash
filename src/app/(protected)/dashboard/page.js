import { DashboardModules } from "@/modules/dashboard";

export const metadata = { title: "Overview Dashboard" };

export default function DashboardPage({ user }) {
  return <DashboardModules user={user} />;
}
