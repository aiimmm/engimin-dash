"use client";

import { apiClient } from "@/lib/api/client";
import { setPendingToast } from "@/hooks/usePendingToast";
import { cn } from "@/lib/utils";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
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
import { toast } from "../ui/toast";

export const LogoutButton = () => {
  const router = useRouter();
  const topLoader = useTopLoader();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    topLoader.start();
    try {
      await apiClient.post("/auth/logout");
      setPendingToast({ type: "success", title: "Berhasil logout. Sampai jumpa!" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      topLoader.done();
      toast.add({ type: "error", title: error?.message || "Gagal logout, silakan coba lagi." });
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Button
        className={cn(
          "group/menu cursor-pointer w-full flex items-center justify-start gap-2 text-sm transition-all duration-200 hover:gap-3",
          "bg-transparent text-red-600 dark:text-red-500 hover:bg-red-500/10",
        )}
        onClick={() => setLogoutOpen(true)}
        size="lg"
      >
        <LogOutIcon className="transition-transform duration-200 group-hover/menu:-rotate-12" />
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
