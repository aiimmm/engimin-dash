// ============================================================================
// APP / AUTH / LOGIN — Login Page (Server Component)
// Purpose: Route component for /auth/login with session check & metadata
// ============================================================================

import { getSession } from "@/lib/auth/session";
import LoginModules from "@/modules/auth/LoginModules";
import { redirect } from "next/navigation";

export const instant = false;

export const metadata = {
  title: "Login | EngiMin Dashboard",
  description: "Halaman masuk terautentikasi sistem internal Travelio",
};

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginModules />;
}
