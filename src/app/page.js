// ============================================================================
// APP / PAGE — Root Page Redirection
// Purpose: Redirect initial visitors to /dashboard if authenticated, else /auth/login
// ============================================================================

import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/auth/login");
  }
}
