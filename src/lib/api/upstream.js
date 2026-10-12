// ============================================================================
// LIB / API — Upstream Server HTTP Instance
// Purpose: Server-side Axios client for communicating with external Travelio Backend API
// Description: Handles base URL, auth token header builder, timeout, and upstream error normalization
// ============================================================================

import "server-only";

import { serverConfig } from "@/lib/config";
import axios from "axios";

export const upstreamApi = axios.create({
  baseURL: serverConfig.apiUrl,
  timeout: serverConfig.timeout,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

upstreamApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 502;
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Layanan upstream melewati batas waktu."
        : "Layanan Work Order tidak dapat dihubungi.");
    return Promise.reject(Object.assign(new Error(message), { status }));
  },
);

export function authorizationHeaders(session) {
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
}
