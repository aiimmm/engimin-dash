"use client";

// ============================================================================
// COMPONENT — User Type Page Guard
// Purpose: Protect pages against unauthorized direct URL navigation per user type
// ============================================================================

import { Button, buttonVariants } from "@/components/ui/button";
import { USER_TYPE_LABELS, USER_TYPES } from "@/lib/permissions";
import { useUserType } from "@/lib/permissions/UserTypeProvider";
import { cn } from "@/lib/utils";
import { ArrowLeft02Icon, SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserTypePageGuard({ children }) {
  const pathname = usePathname();
  const { isAllowed, activeUserType, isPreviewing, setPreview, mounted } = useUserType();

  // If not mounted yet (SSR), render children to prevent hydration mismatches
  if (!mounted) {
    return <>{children}</>;
  }

  const allowed = isAllowed(pathname);

  if (!allowed) {
    const userLabel = USER_TYPE_LABELS[activeUserType] || activeUserType;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="size-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 ring-8 ring-destructive/5">
          <HugeiconsIcon icon={SecurityLockIcon} size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive mb-3">
          <span>Akses Dibatasi</span>
          <span>•</span>
          <span>Tipe Akun: {activeUserType}</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Halaman Ini Tidak Tersedia untuk Anda
        </h2>

        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Tipe akun Anda saat ini terdaftar sebagai{" "}
          <strong className="text-foreground">{userLabel}</strong>. Administrator telah membatasi
          akses ke halaman{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{pathname}</code> untuk tipe ini.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "default" }), "gap-2 shadow-xs")}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
            Kembali ke Overview
          </Link>

          {isPreviewing && (
            <Button
              variant="outline"
              onClick={() => setPreview(USER_TYPES.ADMIN)}
              className="border-dashed"
            >
              Keluar dari Mode Preview Admin
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
