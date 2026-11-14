import { UserTypePageGuard } from "../elements/UserTypePageGuard";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./SidebarComponents";

export const AppShellLayout = ({ user, children }) => {
  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebar />
      <SidebarInset>
        <Header user={user} />
        <div className="flex flex-1 flex-col z-1">
          <div className="@container/main flex flex-1 flex-col gap-6">
            <main className="p-6">
              <UserTypePageGuard>{children}</UserTypePageGuard>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
