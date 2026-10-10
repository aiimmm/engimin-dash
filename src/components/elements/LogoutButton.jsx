"use client";

import { cn } from "@/lib/utils";
import { Logout02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export const LogoutButton = () => {
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
      toast.error(error?.message || "Failed to log out, please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Button
        className={cn(
          "group/menu cursor-pointer w-full flex items-center justify-start gap-2 text-sm transition-all duration-200 hover:gap-3 px-2.5",
          "bg-transparent text-red-600 dark:text-red-500 hover:bg-red-500/10",
        )}
        onClick={() => setLogoutOpen(true)}
        size="lg"
      >
        <HugeiconsIcon
          icon={Logout02Icon}
          className="size-4! transition-transform duration-200 group-hover/menu:-rotate-12"
        />
        Logout
      </Button>
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Your active session will be safely removed from this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "Exiting session..." : "Yes, logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
