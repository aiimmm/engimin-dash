import { AppShellLayout } from "@/components/layouts/AppShellLayout";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login?expired=1");
  return <AppShellLayout user={session.user}>{children}</AppShellLayout>;
}
