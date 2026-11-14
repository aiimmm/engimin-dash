"use client";

import { NAVIGATION_MENU } from "@/commons/constants/Menu";
import { apiClient } from "@/lib/api/client";
import { USER_TYPES } from "@/lib/permissions";
import { useUserType } from "@/lib/permissions/UserTypeProvider";
import { cn, getInitials } from "@/lib/utils";
import { ArrowRightBigIcon, Cancel02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva } from "class-variance-authority";
import { BotIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "../ui/breadcrumb";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "../ui/sidebar";
import { toast } from "../ui/toast";

export const Header = ({ className, user, ...props }) => {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { activeUserType, isPreviewing, setPreview } = useUserType();

  const roleLabel =
    activeUserType === USER_TYPES.COMPLETED
      ? "Team Completed"
      : activeUserType === USER_TYPES.ALLOCATION
        ? "Team Allocation"
        : "Admin Engineering";

  async function logout() {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.add({ type: "error", title: error?.message || "Failed to log out, please try again." });
      setLoggingOut(false);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center gap-6 border-b bg-sidebar text-sidebar-foreground pl-6 pr-5 py-3 backdrop-blur-2xl",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="mr-2 bg-foreground/15" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-foreground">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isPreviewing && (
          <Badge className="hidden items-center md:flex">
            Preview Mode: <span className="capitalize">{activeUserType?.toLowerCase()}</span>
            <Button
              onClick={() => setPreview(USER_TYPES.ADMIN)}
              className="size-5 cursor-pointer"
              title="Kembali ke Mode Admin"
              size="icon"
            >
              <HugeiconsIcon icon={Cancel02Icon} />
            </Button>
          </Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="gap-2 flex items-center cursor-pointer">
              <div className="hidden flex-col items-end gap-1.25 sm:flex">
                <span className="text-right text-[12px] font-medium leading-none tracking-tight">
                  {user?.name}
                </span>
                <Badge className="h-4 px-1 py-0.5 text-[10px]">{roleLabel}</Badge>
              </div>
              <Avatar className="size-10">
                <div className="bg-transparent p-0.5 aspect-square rounded-full border border-primary">
                  <AvatarFallback className="bg-primary text-xs font-bold text-background tracking-tight">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </div>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent className="w-60" align="end" sideOffset={9} alignOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{roleLabel}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="cursor-pointer">
            <LogOutIcon className="h-4 w-4" />
            <span className="text-sm!">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar? Sesi aktif Anda akan diakhiri dari perangkat ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "Sedang keluar..." : "Ya, Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export const Brand = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 px-2 p-1.5">
          <div className="size-10 rounded-full flex items-center justify-center shrink-0 border dark:border-white border-black">
            <div className="bg-foreground rounded-full p-1">
              <BotIcon className="aspect-square size-6 text-background" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">EngiMin</p>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export const Navigation = () => {
  const pathname = usePathname();
  const { isAllowed } = useUserType();

  const isActive = (href) => {
    if (!href) return false;

    const base = href.split("#")[0];
    if (base === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(base);
  };

  return (
    <>
      {NAVIGATION_MENU.map((group) => {
        // Filter visible items according to isShow and userType route permissions
        const visibleItems = group.items.filter((item) => {
          if (!item.isShow) return false;
          if (item.type === "Pages") {
            return isAllowed(item.href);
          }
          return true;
        });

        // If all items in this group are hidden, don't render the empty section
        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <SidebarGroup key={group.groupLabel}>
            <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-1">
              {visibleItems.map((item) => {
                const active = isActive(item.href);

                // Pages
                if (item.type === "Pages") {
                  return (
                    <SidebarMenuItem className="list-none!" key={item.label}>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={active}
                        render={
                          <Link
                            href={item.href}
                            className={cn(
                              "group/menu flex items-center gap-2 px-3 py-2 transition-all duration-200 hover:gap-3",
                              active && "bg-sidebar-accent text-sidebar-accent-foreground gap-3",
                            )}
                          >
                            {item.icon && (
                              <HugeiconsIcon
                                icon={item.icon}
                                size={20}
                                className={cn(
                                  "transition-transform duration-200 group-hover/menu:-rotate-12",
                                  active && "-rotate-12",
                                )}
                              />
                            )}
                            <span className="flex-1">{item.label}</span>
                            {active && (
                              <HugeiconsIcon
                                icon={ArrowRightBigIcon}
                                size={16}
                                className="opacity-70 animate-pulse"
                              />
                            )}
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                }

                // Component
                if (item.type === "Component") {
                  const Component = item.component;
                  return <Component key={item.label} />;
                }

                return null;
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
};

const roleVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      role: {
        admin: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        allocation: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
        default: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { role: "default" },
  },
);

const dotVariants = cva("size-1.5 rounded-full", {
  variants: {
    role: {
      admin: "bg-violet-500",
      completed: "bg-emerald-500",
      allocation: "bg-sky-500",
      default: "bg-muted-foreground",
    },
  },
  defaultVariants: { role: "default" },
});

export const Footer = () => {
  const { activeUserType } = useUserType();

  const role = activeUserType?.toLowerCase();
  const variant = ["admin", "completed", "allocation"].includes(role) ? role : "default";

  const label = !role
    ? "Tidak diketahui"
    : role === "completed" || role === "allocation"
      ? `Team ${role}`
      : role;

  return (
    <div
      role="status"
      aria-label={`Role: ${label}`}
      title={label}
      className={cn(
        "mx-2 mb-2 flex items-center gap-2 justify-between rounded-xl border bg-muted/30 p-3 text-xs shadow-xs transition-colors hover:bg-muted/50",
        // Sidebar mode ikon: sisakan hanya titik status
        "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",
      )}
    >
      <span className="text-[11px] font-semibold leading-none text-muted-foreground group-data-[collapsible=icon]:hidden">
        Role User
      </span>

      <span
        className={cn(
          roleVariants({ role: variant }),
          "group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(dotVariants({ role: variant }), "group-data-[collapsible=icon]:size-2.5")}
        />
        <span className="truncate capitalize group-data-[collapsible=icon]:hidden">{label}</span>
      </span>
    </div>
  );
};
