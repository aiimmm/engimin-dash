// ============================================================================
// MODULES / AUTH — Auth Response Utility
// Purpose: Safely parse and validate backend API login response
// Security: Strips sensitive fields (like pwd) and validates user status
// ============================================================================

import { AUTH_MESSAGES } from "../constants/auth.constants";

/**
 * Extracts user record from heterogeneous backend response data array.
 * @param {Array} dataArray
 * @returns {Object|null}
 */
function extractUserFromData(dataArray) {
  if (!Array.isArray(dataArray)) return null;
  return (
    dataArray.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item._id || item.usr || item.email || typeof item.isActive === "boolean"),
    ) || null
  );
}

/**
 * Extracts metadata like expired or posDate from backend response data array.
 * @param {Array} dataArray
 * @returns {Object}
 */
function extractMetaFromData(dataArray) {
  if (!Array.isArray(dataArray)) return {};
  const meta = {};
  for (const item of dataArray) {
    if (item && typeof item === "object") {
      if (item.expired) meta.expired = item.expired;
      if (item.posDate) meta.posDate = item.posDate;
    }
  }
  return meta;
}

/**
 * Parses, validates and sanitizes backend authentication response.
 * @param {Object} rawResponse
 * @returns {{ success: boolean, user: Object, meta: Object, isNeedChangePass: boolean }}
 */
export function parseAuthResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== "object") {
    throw new Error(AUTH_MESSAGES.GENERIC_ERROR);
  }

  if (rawResponse.success !== true) {
    const errorMsg = rawResponse.message || rawResponse.error || AUTH_MESSAGES.INVALID_CREDENTIALS;
    throw new Error(errorMsg);
  }

  const rawUser = extractUserFromData(rawResponse.data);
  if (!rawUser) {
    throw new Error(AUTH_MESSAGES.GENERIC_ERROR);
  }

  // Check account active state
  if (rawUser.isActive === false) {
    throw new Error(AUTH_MESSAGES.INACTIVE_ACCOUNT);
  }

  const meta = extractMetaFromData(rawResponse.data);

  // Securely sanitize user object (STRIP PASSWORDS & HASHES!)
  const sanitizedUser = {
    _id: rawUser._id || "",
    name: rawUser.name || rawUser.usr || "User",
    usr: rawUser.usr || "",
    email: rawUser.email || "",
    isActive: rawUser.isActive ?? true,
    isLoginWithEmail: Boolean(rawUser.isLoginWithEmail),
    isNeedChangePass: Boolean(rawUser.isNeedChangePass),
  };

  return {
    success: true,
    user: sanitizedUser,
    meta,
    isNeedChangePass: sanitizedUser.isNeedChangePass,
    encryptedUserData:
      typeof rawResponse.encryptedUserData === "string" ? rawResponse.encryptedUserData : null,
  };
}
