"use client";

// ============================================================================
// PROVIDER — Background Sheet Auto-Sync (DEACTIVATED)
// Purpose: Automatic background syncing is permanently disabled as per user specification.
// Spreadsheet syncing is now performed manually via /dashboard/settings.
// ============================================================================

export function BackgroundSheetSyncProvider({ children }) {
  // Silent auto-sync intentionally deactivated.
  return children;
}

export default BackgroundSheetSyncProvider;
