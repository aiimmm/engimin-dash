import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./SidebarComponents";

export const AppShellLayout = ({ user, children }) => {
  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebar />
      <SidebarInset>
        <Header user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4">
            <main className="p-4">{children}</main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
