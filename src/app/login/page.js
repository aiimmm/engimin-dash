import { getSession } from "@/lib/auth/session";
import { LoginModules } from "@/modules/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return <LoginModules />;
}
