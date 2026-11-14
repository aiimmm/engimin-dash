"use client";

// ============================================================================
// MODULE — /dashboard/settings (Settings & Integrations Hub)
// Purpose: Main settings view managing manual spreadsheet sync and excel exports
// ============================================================================

import { Typography } from "@/components/elements/Typography";
import { ExcelExportCard } from "./ExcelExportCard";
import { GoogleSheetsSyncCard } from "./GoogleSheetsSyncCard";
import { UserTypeAccessControlCard } from "./UserTypeAccessControlCard";

export function SettingsModules({ user }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-start xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <Typography as="h2" className="font-extrabold">
            Settings & Integrations
          </Typography>
          <Typography as="p" className="text-sm text-muted-foreground mt-1">
            Kelola hak akses navigasi user type, sinkronisasi Google Spreadsheet, dan ekspor data
            work order ke file Excel (.xlsx).
          </Typography>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="space-y-6">
        <UserTypeAccessControlCard />
        <GoogleSheetsSyncCard />
        <ExcelExportCard />
      </div>
    </div>
  );
}

export default SettingsModules;
