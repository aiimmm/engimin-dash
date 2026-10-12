import { EngineerMonitoringModules } from "@/modules/engineer-monitoring";

export const metadata = { title: "Engineer Monitoring" };

export default function EngineerMonitoringPage({ user }) {
  return (
    <>
      <EngineerMonitoringModules user={user} />
    </>
  );
}
