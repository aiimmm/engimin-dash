// ============================================================================
// MODULES / AUTH — LoginModules Component
// Purpose: Login page layout container with background effects & Suspense boundary
// ============================================================================

import { BackgroundAnimatedGridPattern } from "@/components/elements/BackgroundAnimated";
import { CogIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

function LoginFormFallback() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 rounded-xl border bg-card/80 backdrop-blur-sm shadow-md animate-pulse">
      <div className="h-6 w-32 bg-muted rounded self-center" />
      <div className="h-4 w-48 bg-muted rounded self-center mb-4" />
      <div className="h-10 w-full bg-muted rounded" />
      <div className="h-10 w-full bg-muted rounded" />
      <div className="h-10 w-full bg-primary/30 rounded mt-2" />
    </div>
  );
}

export function LoginModules() {
  return (
    <section>
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-4 md:p-10">
        <div className="fixed inset-0 flex mx-auto pointer-events-none h-screen w-screen items-center justify-center overflow-hidden bg-background">
          <BackgroundAnimatedGridPattern />
        </div>

        {/* Glow blobs */}
        <div className="absolute top-1/5 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/5 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex w-full max-w-sm flex-col gap-6 z-1">
          <div className="flex items-center gap-2 self-center font-medium">
            <HugeiconsIcon icon={CogIcon} className="size-6" />
            Engineering Admin
          </div>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

export default LoginModules;
