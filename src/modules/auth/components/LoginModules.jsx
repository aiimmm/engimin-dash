"use client";

import { BackgroundAnimatedGridPattern } from "@/components/elements/BackgroundAnimated";
import { usePendingToast } from "@/hooks/usePendingToast";
import { CogIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoginForm } from "./LoginForm";

export const LoginModules = () => {
  usePendingToast();

  return (
    <section>
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <div className="fixed inset-0 flex mx-auto pointer-events-none h-screen w-screen items-center justify-center overflow-hidden bg-background">
          <BackgroundAnimatedGridPattern />
        </div>

        {/* Glow blobs */}
        <div className="absolute top-1/5 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/5 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex w-full max-w-100 flex-col gap-6 z-1">
          <div className="flex items-center gap-2 self-center font-medium">
            <HugeiconsIcon icon={CogIcon} className="size-6" />
            Engineering Admin
          </div>
          <LoginForm />
        </div>
      </div>
    </section>
  );
};

export default LoginModules;
