import { SettingsModules } from "@/modules/settings";

export const metadata = { title: "Settings & Integrations" };

export default function SettingsPage({ user }) {
  return (
    <>
      <SettingsModules user={user} />
    </>
  );
}
