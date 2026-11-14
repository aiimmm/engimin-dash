// ============================================================================
// LIB / PERMISSIONS — User Type & Access Control Management
// Purpose: Multi-tenant / Multi-account role-based access control (RBAC)
// Description: Manages route visibility and access permissions for ADMIN, COMPLETED, and ALLOCATION user types
// ============================================================================

export const USER_TYPES = {
  ADMIN: "ADMIN",
  COMPLETED: "COMPLETED",
  ALLOCATION: "ALLOCATION",
};

export const USER_TYPE_LABELS = {
  ADMIN: "Administrator (Full Access)",
  COMPLETED: "Completed Specialist",
  ALLOCATION: "Allocation Specialist",
};

export const STORAGE_KEY_PERMISSIONS = "engimin_user_type_permissions";
export const STORAGE_KEY_PREVIEW = "engimin_admin_preview_user_type";
export const PERMISSIONS_CHANGE_EVENT = "engimin:permissions-changed";

/**
 * Domain-to-User-Type mappings for multi-account deployment.
 * Automatically detects the role based on the accessing domain.
 */
export const DOMAIN_USER_TYPE_MAP = {
  "ri1.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "ri2.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "ri3.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "ri4.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "ri5.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "ri6.jossjiss.ai.id": USER_TYPES.ALLOCATION,
  "teamcompleted.jossjiss.ai.id": USER_TYPES.COMPLETED,
  "teamcomplete.jossjiss.ai.id": USER_TYPES.COMPLETED,
  "timcompleted.jossjiss.ai.id": USER_TYPES.COMPLETED,
  "timcomplete.jossjiss.ai.id": USER_TYPES.COMPLETED,
  "admin.jossjiss.ai.id": USER_TYPES.ADMIN,
};

/**
 * List of all navigable pages.
 */
export const ALL_PAGE_ROUTES = [
  "/dashboard",
  "/dashboard/action-dates",
  "/dashboard/created-dates",
  "/dashboard/engineer-monitoring",
  "/dashboard/allocation",
  "/dashboard/appointment",
  "/dashboard/conflict",
  "/dashboard/aging",
  "/dashboard/settings",
];

/**
 * List of all navigable pages that can be toggled by the Administrator.
 */
export const CONTROLLABLE_ROUTES = [
  {
    href: "/dashboard",
    label: "Overview",
    group: "Workspace",
    description: "Halaman ringkasan dashboard utama & statistik global",
  },
  {
    href: "/dashboard/action-dates",
    label: "Action Dates",
    group: "Workspace",
    description: "Work orders berdasarkan tanggal jadwal tindakan",
  },
  {
    href: "/dashboard/created-dates",
    label: "Created Dates",
    group: "Workspace",
    description: "Work orders yang baru dibuat pada hari ini",
  },
  {
    href: "/dashboard/engineer-monitoring",
    label: "Monitoring",
    group: "Workspace",
    description: "Monitoring status beban kerja & rekapitulasi engineer",
  },
  {
    href: "/dashboard/allocation",
    label: "Allocation",
    group: "Mandatory Workspace",
    description: "Alokasi work order unit non in-house & key retrieval",
  },
  {
    href: "/dashboard/appointment",
    label: "Appointment",
    group: "Mandatory Workspace",
    description: "Jadwal appointment tenant & sinkronisasi work order",
  },
  {
    href: "/dashboard/conflict",
    label: "Conflict",
    group: "Mandatory Workspace",
    description: "Pendeteksian konflik antara jadwal check-in & work order",
  },
  {
    href: "/dashboard/aging",
    label: "Aging",
    group: "Mandatory Workspace",
    description: "Pemantauan work order yang tertahan lebih dari target",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    group: "Preferences",
    description: "Pengaturan integrasi Google Sheets & kontrol hak akses",
  },
];

/**
 * Specific action features that can be enabled/disabled per user type.
 */
export const CONTROLLABLE_FEATURES = [
  {
    id: "syncGoogleSheet",
    label: 'Tombol "Sinkronkan Sekarang"',
    location: "/dashboard/settings",
    description:
      "Mengizinkan eksekusi tombol sinkronisasi manual ke Google Spreadsheet di halaman Settings.",
    actionType: "disable",
  },
  {
    id: "actionDatesExtend",
    label: 'Tombol "Extend"',
    location: "/dashboard/action-dates",
    description:
      "Menampilkan dan mengaktifkan tombol perpanjang jadwal (Extend) work order terpilih di halaman Action Dates.",
    actionType: "disable_hide",
  },
  {
    id: "actionDatesMove",
    label: 'Tombol "Move"',
    location: "/dashboard/action-dates",
    description:
      "Menampilkan dan mengaktifkan tombol pemindahan jadwal (Move) work order terpilih di halaman Action Dates.",
    actionType: "disable_hide",
  },
];

export const DEFAULT_FEATURES_PER_USER_TYPE = {
  ADMIN: {
    syncGoogleSheet: true,
    actionDatesExtend: true,
    actionDatesMove: true,
  },
  COMPLETED: {
    syncGoogleSheet: false,
    actionDatesExtend: false,
    actionDatesMove: false,
  },
  ALLOCATION: {
    syncGoogleSheet: false,
    actionDatesExtend: false,
    actionDatesMove: false,
  },
};

/**
 * Default permission presets for each user type.
 * All user types can access all pages by default. Specific features are controlled individually.
 */
export const DEFAULT_USER_TYPE_PERMISSIONS = {
  ADMIN: {
    allowedRoutes: ALL_PAGE_ROUTES,
    features: DEFAULT_FEATURES_PER_USER_TYPE.ADMIN,
  },
  COMPLETED: {
    allowedRoutes: ALL_PAGE_ROUTES,
    features: DEFAULT_FEATURES_PER_USER_TYPE.COMPLETED,
  },
  ALLOCATION: {
    allowedRoutes: ALL_PAGE_ROUTES,
    features: DEFAULT_FEATURES_PER_USER_TYPE.ALLOCATION,
  },
};

/**
 * Resolve user type from a hostname string.
 * @param {string} hostname e.g. "ri2.jossjiss.ai.id" or "localhost"
 * @returns {string|null} "ADMIN" | "COMPLETED" | "ALLOCATION" | null
 */
export function resolveUserTypeFromDomain(hostname = "") {
  if (!hostname) return null;
  const cleanHost = String(hostname).toLowerCase().trim().split(":")[0];

  // 1. Direct dictionary match
  if (DOMAIN_USER_TYPE_MAP[cleanHost]) {
    return DOMAIN_USER_TYPE_MAP[cleanHost];
  }

  // 2. Pattern match for all RI / allocation subdomains (e.g. ri1 through ri6, ri7, allocation)
  if (
    /^(ri\d+|allocation)(\.|$)/i.test(cleanHost) ||
    /^(ri\d+|allocation)\.jossjiss\.ai\.id$/i.test(cleanHost)
  ) {
    return USER_TYPES.ALLOCATION;
  }

  // 3. Pattern match for all completed team subdomains (e.g. teamcompleted, teamcomplete, timcomplete, timcompleted, complete, completed)
  if (
    /^(tim|team)?complete(d)?(\.|$)/i.test(cleanHost) ||
    /^(tim|team)?complete(d)?\.jossjiss\.ai\.id$/i.test(cleanHost)
  ) {
    return USER_TYPES.COMPLETED;
  }

  // 4. Pattern match for admin subdomains
  if (/^admin(\.|$)/i.test(cleanHost) || /^admin\.jossjiss\.ai\.id$/i.test(cleanHost)) {
    return USER_TYPES.ADMIN;
  }

  // 5. Suffix match
  for (const [domain, type] of Object.entries(DOMAIN_USER_TYPE_MAP)) {
    if (cleanHost === domain || cleanHost.endsWith(`.${domain}`)) {
      return type;
    }
  }
  return null;
}

/**
 * Resolves effective user type based on:
 * 1. Current domain/hostname (ri2.jossjiss.ai.id -> ALLOCATION, teamcomplete.jossjiss.ai.id -> COMPLETED, admin.jossjiss.ai.id -> ADMIN)
 * 2. NEXT_PUBLIC_USER_TYPE environment variable (if explicitly set)
 * 3. Fallback to ADMIN (e.g. localhost or unmapped domains)
 * @param {string} [serverHost] optional host passed from server-side headers
 * @returns {string} "ADMIN" | "COMPLETED" | "ALLOCATION"
 */
export function getEffectiveUserType(serverHost = "") {
  // 1. Check hostname in browser environment
  if (typeof window !== "undefined" && window.location?.hostname) {
    const domainType = resolveUserTypeFromDomain(window.location.hostname);
    if (domainType) return domainType;
  }

  // 1b. Check server host if provided
  if (serverHost) {
    const domainType = resolveUserTypeFromDomain(serverHost);
    if (domainType) return domainType;
  }

  // 2. Check environment variable override
  const raw = process.env.NEXT_PUBLIC_USER_TYPE || "";
  const normalized = String(raw).trim().toUpperCase();
  if (normalized === USER_TYPES.COMPLETED) return USER_TYPES.COMPLETED;
  if (normalized === USER_TYPES.ALLOCATION) return USER_TYPES.ALLOCATION;
  if (normalized === USER_TYPES.ADMIN) return USER_TYPES.ADMIN;

  // 3. Fallback to ADMIN (localhost / default)
  return USER_TYPES.ADMIN;
}

/**
 * Resolves current configured user type (backward compatible alias).
 * @returns {string} "ADMIN" | "COMPLETED" | "ALLOCATION"
 */
export function getEnvUserType() {
  return getEffectiveUserType();
}

/**
 * Retrieve user permissions from localStorage (customized by Admin) or fallback to defaults.
 * @returns {Object}
 */
export function getStoredPermissions() {
  if (typeof window === "undefined") {
    return DEFAULT_USER_TYPE_PERMISSIONS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    if (!raw) return DEFAULT_USER_TYPE_PERMISSIONS;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_USER_TYPE_PERMISSIONS;

    return {
      ADMIN: {
        allowedRoutes: [
          ...new Set([
            ...DEFAULT_USER_TYPE_PERMISSIONS.ADMIN.allowedRoutes,
            ...(parsed.ADMIN?.allowedRoutes || []),
          ]),
        ],
        features: {
          ...DEFAULT_FEATURES_PER_USER_TYPE.ADMIN,
          ...(parsed.ADMIN?.features || {}),
        },
      },
      COMPLETED: {
        allowedRoutes: Array.isArray(parsed.COMPLETED?.allowedRoutes)
          ? parsed.COMPLETED.allowedRoutes
          : DEFAULT_USER_TYPE_PERMISSIONS.COMPLETED.allowedRoutes,
        features: {
          ...DEFAULT_FEATURES_PER_USER_TYPE.COMPLETED,
          ...(parsed.COMPLETED?.features || {}),
        },
      },
      ALLOCATION: {
        allowedRoutes: Array.isArray(parsed.ALLOCATION?.allowedRoutes)
          ? parsed.ALLOCATION.allowedRoutes
          : DEFAULT_USER_TYPE_PERMISSIONS.ALLOCATION.allowedRoutes,
        features: {
          ...DEFAULT_FEATURES_PER_USER_TYPE.ALLOCATION,
          ...(parsed.ALLOCATION?.features || {}),
        },
      },
    };
  } catch {
    return DEFAULT_USER_TYPE_PERMISSIONS;
  }
}

/**
 * Persist modified permissions into localStorage and notify subscribers.
 * @param {Object} newPermissions
 */
export function saveStoredPermissions(newPermissions) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(newPermissions));
    window.dispatchEvent(new CustomEvent(PERMISSIONS_CHANGE_EVENT, { detail: newPermissions }));
  } catch (err) {
    console.error("[Permissions] Failed to save stored permissions:", err);
  }
}

/**
 * Reset stored permissions back to factory defaults.
 */
export function resetStoredPermissions() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_PERMISSIONS);
    window.dispatchEvent(
      new CustomEvent(PERMISSIONS_CHANGE_EVENT, {
        detail: DEFAULT_USER_TYPE_PERMISSIONS,
      }),
    );
  } catch (err) {
    console.error("[Permissions] Failed to reset stored permissions:", err);
  }
}

/**
 * Determine if a specific route is allowed for a user type.
 * @param {string} routeHref - e.g. "/dashboard/allocation"
 * @param {string} userType - e.g. "ADMIN", "COMPLETED", "ALLOCATION"
 * @param {Object} [permissions] - optional permissions map
 * @returns {boolean}
 */
export function isRouteAllowed(routeHref, userType, permissions = null) {
  if (!routeHref) return true;
  const normalizedType = String(userType || "")
    .trim()
    .toUpperCase();

  // Admin always has unrestricted access to all routes
  if (normalizedType === USER_TYPES.ADMIN) {
    return true;
  }

  const activePermissions = permissions || getStoredPermissions();
  const typeConfig = activePermissions[normalizedType];

  if (!typeConfig || !Array.isArray(typeConfig.allowedRoutes)) {
    // Fallback to default if not configured
    const defaultConfig = DEFAULT_USER_TYPE_PERMISSIONS[normalizedType];
    return defaultConfig ? defaultConfig.allowedRoutes.includes(routeHref) : false;
  }

  return typeConfig.allowedRoutes.includes(routeHref);
}

/**
 * Determine if a specific feature action is allowed for a user type.
 * @param {string} featureId - e.g. "syncGoogleSheet" | "createdDatesExtend" | "createdDatesMove"
 * @param {string} userType - e.g. "ADMIN", "COMPLETED", "ALLOCATION"
 * @param {Object} [permissions] - optional permissions map
 * @returns {boolean}
 */
export function isFeatureAllowed(featureId, userType, permissions = null) {
  if (!featureId) return true;
  const normalizedType = String(userType || "")
    .trim()
    .toUpperCase();

  // Admin always has full access to all features
  if (normalizedType === USER_TYPES.ADMIN) {
    return true;
  }

  const activePermissions = permissions || getStoredPermissions();
  const typeConfig = activePermissions[normalizedType];

  if (!typeConfig || !typeConfig.features) {
    const defaultFeatures = DEFAULT_FEATURES_PER_USER_TYPE[normalizedType];
    return Boolean(defaultFeatures?.[featureId]);
  }

  return Boolean(typeConfig.features[featureId]);
}
