// ============================================================================
// STORE — Global Auto-Refresh State
// Purpose: Persistently manage global auto-refresh active/paused state in localStorage
// ============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAutoRefreshStore = create(
  persist(
    (set) => ({
      isAutoRefreshEnabled: true,
      toggleAutoRefresh: () =>
        set((state) => ({ isAutoRefreshEnabled: !state.isAutoRefreshEnabled })),
      setAutoRefresh: (enabled) => set({ isAutoRefreshEnabled: Boolean(enabled) }),
    }),
    {
      name: "travelio_auto_refresh_enabled",
    },
  ),
);
