// ============================================================================
// LIB / API — Global Security & Request Validation
// Purpose: Origin verification and safe error sanitization for API routes
// ============================================================================

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  return (!origin || origin === request.nextUrl.origin) && (!site || site === "same-origin");
}

export function safeError(error, fallback = "Permintaan tidak dapat diproses.") {
  return {
    message: error?.message || fallback,
    status: Number(error?.status) >= 400 ? Number(error.status) : 500,
  };
}
