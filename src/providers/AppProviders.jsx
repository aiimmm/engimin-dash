"use client";

import TopLoader from "@/components/elements/TopLoader";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QUERY_GC_MS, QUERY_STALE_MS } from "@/lib/config/refresh";
import { UserTypeProvider } from "@/lib/permissions/UserTypeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NextThemeProvider } from "./NextThemeProvider";

export function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_MS,
            gcTime: QUERY_GC_MS,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <UserTypeProvider>
          <TopLoader />
          <TooltipProvider>
            {/* <BackgroundSheetSyncProvider>{children}</BackgroundSheetSyncProvider> */}
            {children}
          </TooltipProvider>
          <Toaster />
        </UserTypeProvider>
      </QueryClientProvider>
    </NextThemeProvider>
  );
}
