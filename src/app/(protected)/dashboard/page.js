import DashboardModules from "@/modules/dashboard";

export const metadata = { title: "Overview Dashboard" };

export default function DashboardPage({ user }) {
  return (
    <div className="space-y-6">
      <DashboardModules user={user} />
    </div>
  );
}
