// ============================================================================
// CONFIG — Centralized Auto-Refresh & Caching Settings (in Seconds)
// Configured via NEXT_PUBLIC_AUTO_REFRESH_INTERVAL_SECONDS & NEXT_PUBLIC_QUERY_STALE_TIME_SECONDS
// ============================================================================

import { useAutoRefreshStore } from "@/lib/stores/useAutoRefreshStore";

const parsedSeconds = Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL_SECONDS);
const parsedMinutesFallback = Number(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL_MINUTES);

// Default: 30 detik
export const REFRESH_INTERVAL_SECONDS =
  !isNaN(parsedSeconds) && parsedSeconds > 0
    ? parsedSeconds
    : !isNaN(parsedMinutesFallback) && parsedMinutesFallback > 0
      ? parsedMinutesFallback * 60
      : 30;

const parsedStaleSeconds = Number(process.env.NEXT_PUBLIC_QUERY_STALE_TIME_SECONDS);
const parsedStaleMinutesFallback = Number(process.env.NEXT_PUBLIC_QUERY_STALE_TIME_MINUTES);

export const QUERY_STALE_SECONDS =
  !isNaN(parsedStaleSeconds) && parsedStaleSeconds > 0
    ? parsedStaleSeconds
    : !isNaN(parsedStaleMinutesFallback) && parsedStaleMinutesFallback > 0
      ? parsedStaleMinutesFallback * 60
      : REFRESH_INTERVAL_SECONDS;

// Dalam milidetik (ms) untuk React Query
export const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_SECONDS * 1000;
export const QUERY_STALE_MS = QUERY_STALE_SECONDS * 1000;
export const QUERY_GC_MS = Math.max(QUERY_STALE_MS + 300_000, 600_000);

/**
 * Hook to dynamically provide refetchInterval based on global AutoRefreshSwitch state.
 * Returns REFRESH_INTERVAL_MS if auto-refresh is active, or false if paused/disabled.
 */
export function useAutoRefreshInterval() {
  const isEnabled = useAutoRefreshStore((state) => state.isAutoRefreshEnabled);
  return isEnabled ? REFRESH_INTERVAL_MS : false;
}
