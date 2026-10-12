"use client";

import TopLoader from "@/components/elements/TopLoader";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BackgroundSheetSyncProvider } from "./BackgroundSheetSyncProvider";
import { NextThemeProvider } from "./NextThemeProvider";

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TopLoader />
        <TooltipProvider>
          <BackgroundSheetSyncProvider>{children}</BackgroundSheetSyncProvider>
        </TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </NextThemeProvider>
  );
}
