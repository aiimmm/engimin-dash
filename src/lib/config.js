// ============================================================================
// LIB / API — Server Configuration & Environment
// Purpose: Server-side environment variables and session secret accessor
// ============================================================================

import "server-only";

export const serverConfig = {
  apiUrl: (process.env.API_URL || "https://liohd.travelio.com/v1/api").replace(/\/$/, ""),
  timeout: Number(process.env.API_TIMEOUT_MS || 15000),
};

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}
