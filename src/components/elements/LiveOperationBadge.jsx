"use client";

// ============================================================================
// COMPONENT — LiveOperationBadge
// Purpose: Dynamic header badge displaying "Live Operation" (active) or "Operation Paused" (paused)
// Optimized to prevent flicker / glitch during client-side page transitions
// ============================================================================

import { useAutoRefreshStore } from "@/lib/stores/useAutoRefreshStore";

export const LiveOperationBadge = ({ className = "" }) => {
  const isAutoRefreshEnabled = useAutoRefreshStore((state) => state.isAutoRefreshEnabled);

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded-xl w-fit border bg-sidebar mb-3 ${className}`}
    >
      <span
        suppressHydrationWarning
        className={`size-1.5 rounded-full ${
          isAutoRefreshEnabled ? "bg-green-500" : "bg-amber-500"
        }`}
      />
      <p
        suppressHydrationWarning
        className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {isAutoRefreshEnabled ? "Auto Refresh Active" : "Auto Refresh Paused"}
      </p>
    </div>
  );
};

export default LiveOperationBadge;
