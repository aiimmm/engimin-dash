"use client";

// ============================================================================
// COMPONENT — AutoRefreshSwitch
// Purpose: Toggle switch for activating/deactivating global auto-refresh
// ============================================================================

import { useAutoRefreshStore } from "@/lib/stores/useAutoRefreshStore";
import { cn } from "@/lib/utils";
import { RefreshCwIcon, RefreshCwOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch } from "../ui/switch";

export const AutoRefreshSwitch = () => {
  const isAutoRefreshEnabled = useAutoRefreshStore((state) => state.isAutoRefreshEnabled);
  const setAutoRefresh = useAutoRefreshStore((state) => state.setAutoRefresh);

  const handleToggle = (checked) => {
    setAutoRefresh(checked);
  };

  return (
    <div className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium px-2.5 py-2 w-full justify-between h-8">
      <div className="flex items-center gap-2">
        <div>
          <HugeiconsIcon
            icon={isAutoRefreshEnabled ? RefreshCwIcon : RefreshCwOffIcon}
            className={cn(
              "size-4!",
              // isAutoRefreshEnabled ? "text-emerald-500" : "text-muted-foreground",
            )}
          />
        </div>
        <p className={cn("leading-7 flex grow max-w-50 truncate translate-x-0 opacity-100")}>
          Auto Refresh
        </p>
      </div>
      <Switch
        id="switch-auto-refresh"
        className="cursor-pointer"
        checked={isAutoRefreshEnabled}
        onCheckedChange={handleToggle}
        aria-checked={isAutoRefreshEnabled}
        aria-label={isAutoRefreshEnabled ? "Matikan Auto Refresh" : "Aktifkan Auto Refresh"}
      />
    </div>
  );
};

export default AutoRefreshSwitch;
