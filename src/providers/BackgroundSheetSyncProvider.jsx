"use client";

// ============================================================================
// PROVIDER — Background Sheet Auto-Sync
// Purpose: Silently syncs Appointment & CI Conflict data to Google Sheets every 3 minutes in the background on all pages unconditionally
// ============================================================================

import { defaultAgingDateRange } from "@/modules/aging/lib";
import { apiClient } from "@/lib/api/client";
import { getConflictDateRangeForSync } from "@/modules/appointment/lib";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function BackgroundSheetSyncProvider({ children }) {
  const pathname = usePathname();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Skip if on public/login pages
    if (pathname === "/login") return;

    const runSilentSync = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const targetDate = tomorrow();
        const conflictRange = getConflictDateRangeForSync(targetDate);
        const agingRange = defaultAgingDateRange();

        // 1. Fetch 1-day appointment orders
        let appointmentRows = [];
        try {
          const appointmentRes = await apiClient.get("/workorders", {
            params: { all: 1, dateFrom: targetDate, dateTo: targetDate },
          });
          appointmentRows = appointmentRes.data?.rows || [];
        } catch (err) {
          console.warn("[BackgroundSheetSync] Appointment rows fetch failed:", err);
        }

        // 2. Fetch 1-week ahead CI conflict orders
        let conflictRows = [];
        try {
          const conflictRes = await apiClient.get("/workorders", {
            params: {
              all: 1,
              conflict: 1,
              dateFrom: conflictRange.from,
              dateTo: conflictRange.to,
            },
          });
          conflictRows = conflictRes.data?.rows || [];
        } catch (err) {
          console.warn("[BackgroundSheetSync] Conflict rows fetch failed:", err);
        }

        // 3. Fetch Aging orders
        let agingRows = [];
        try {
          const agingRes = await apiClient.get("/workorders", {
            params: {
              all: 1,
              aging: 1,
              dateFrom: agingRange.from,
              dateTo: agingRange.to,
            },
          });
          agingRows = agingRes.data?.rows || [];
        } catch (err) {
          console.warn("[BackgroundSheetSync] Aging rows fetch failed:", err);
        }

        // 4. Post combined data to sync-sheet endpoint silently
        await apiClient.post("/workorders/required-wo/sync-sheet", {
          date: targetDate,
          appointmentRows,
          conflictRows,
          agingRows,
        });
      } catch (err) {
        // Silent error catch so user navigation is never disturbed
        console.debug("[BackgroundSheetSync] Background sync check completed or skipped:", err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Run immediately when page is visited/navigated to
    runSilentSync();

    // Run recurring every 3 minutes (180,000 ms)
    const intervalId = setInterval(runSilentSync, 180_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pathname]);

  return children;
}
