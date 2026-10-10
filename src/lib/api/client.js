// ============================================================================
// LIB / API — Client-Side Axios HTTP Instance
// Purpose: Browser-side API client for calling internal Next.js API routes (/api/*)
// Description: Includes base URL, timeout, X-Requested-With header, and 401 session redirect
// ============================================================================

"use client";

import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 20000,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/auth/login") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/auth/login?expired=1");
    }
    const message =
      error.response?.data?.message || "An unexpected error occurred. Please try again later.";
    return Promise.reject(Object.assign(new Error(message), { status: error.response?.status }));
  },
);
