"use client";

import { NAVIGATION_MENU } from "@/commons/constants/Menu";
import { apiClient } from "@/lib/api/client";
import { cn, getInitials } from "@/lib/utils";
import { ArrowRightBigIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ActivityIcon, BotIcon, LogOutIcon, ServerIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
        "sticky top-0 z-10 flex items-center gap-2 border-b bg-sidebar text-sidebar-foreground pl-6 pr-5 py-3 backdrop-blur-2xl",
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
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="gap-2 flex items-center">
              <div className="hidden flex-col items-end gap-1.25 sm:flex">
                <span className="text-right text-[12px] font-medium leading-none tracking-tight">
                  {user?.name}
                </span>
                <Badge className="h-4 px-1 py-0.5 text-[10px]">Admin Engineering</Badge>
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
                <p className="text-xs leading-none text-muted-foreground">Admin Engineering</p>
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
      {NAVIGATION_MENU.map((group) => (
        <SidebarGroup key={group.groupLabel}>
          <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-1">
            {group.items
              .filter((item) => item.isShow)
              .map((item) => {
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
      ))}
    </>
  );
};

export const Footer = () => {
  const [status, setStatus] = useState("loading"); // "ready", "down", "loading"
  const [ping, setPing] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkApiStatus() {
      const startTime = performance.now();
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (response.ok) {
          if (isMounted) {
            setStatus("ready");
            setPing(latency);
          }
        } else {
          if (isMounted) {
            setStatus("down");
            setPing(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          setStatus("down");
          setPing(null);
        }
      }
    }

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 10000); // Polling setiap 10 detik

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-2 mb-2 rounded-xl border bg-muted/30 p-3 text-xs shadow-xs transition-all hover:bg-muted/50">
      <div className="flex flex-col items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ServerIcon className="size-3.5 text-foreground/70" />
          <span>API Services</span>
        </div>
        {status === "loading" ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-foreground/40 animate-ping" />
            Checking...
          </span>
        ) : status === "ready" ? (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {ping !== null && (
              <span className="flex items-center gap-1 text-foreground/80">
                <ActivityIcon className="size-3 text-foreground/50" />
                Ping · {ping}ms
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-md border bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 px-1.5 py-0.5 font-sans font-medium">
              <span className="size-1.5 rounded-full bg-green-700 dark:bg-green-300" />
              Ready
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-sans font-medium bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
              <span className="size-1.5 rounded-full bg-red-700 dark:bg-red-300" />
              Down
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
