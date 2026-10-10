import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function ProtectedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?expired=1");
  return <AppShellLayout user={session.user}>{children}</AppShellLayout>;
}
