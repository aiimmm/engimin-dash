// src/providers/ThemeProvider.jsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// ─────────────────────────────────────────────────────────────────────────────
// next-themes menyuntikkan <script> inline untuk mencegah theme flash (FOUC).
// Di React 19, script tag di dalam komponen memicu console warning:
//   "Encountered a script tag while rendering React component..."
//
// Ini adalah FALSE POSITIVE — script tetap berjalan normal saat SSR.
// next-themes belum diupdate untuk mengatasi ini (per 2025).
//
// Solusi: suppress warning spesifik ini di development.
// Di production console.error tidak dipanggil untuk warning ini, jadi aman.
// Ref: https://github.com/shadcn-ui/ui/issues/10104
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _origConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
    _origConsoleError.apply(console, args);
  };
}

export function NextThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
