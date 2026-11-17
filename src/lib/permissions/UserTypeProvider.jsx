"use client";

// ============================================================================
// CONTEXT / HOOK — User Type & Access Control Provider
// Purpose: Provide reactive user type permissions across the application
// Storage: Upstash Redis (via /api/permissions) → localStorage fallback
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_USER_TYPE_PERMISSIONS,
  PERMISSIONS_CHANGE_EVENT,
  STORAGE_KEY_PREVIEW,
  USER_TYPES,
  getEnvUserType,
  getStoredPermissions,
  isFeatureAllowed as checkFeatureAllowed,
  isRouteAllowed,
  resetStoredPermissions,
  saveStoredPermissions,
} from "./index";

const emptySubscribe = () => () => {};

const UserTypeContext = createContext(null);

// ----------------------------------------------------------------------------
// Helpers: Redis API calls (with in-flight deduplication & cache TTL)
// ----------------------------------------------------------------------------

export const STORAGE_KEY_LAST_SYNC = "engimin_permissions_last_sync";
const SYNC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit TTL cache (mencegah spam request ke /api/permissions)

let inFlightFetchPromise = null;

/** Ambil permissions dari /api/permissions (Redis). Null jika gagal. */
async function fetchPermissionsFromApi() {
  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  inFlightFetchPromise = (async () => {
    try {
      const res = await fetch("/api/permissions", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.permissions || null;
    } catch {
      return null;
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  return inFlightFetchPromise;
}

/** Simpan permissions ke /api/permissions (Redis). */
async function pushPermissionsToApi(newPermissions) {
  try {
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPermissions),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Permissions] Gagal sinkronisasi ke Redis:", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Permissions] Gagal sinkronisasi ke Redis:", err?.message);
    return false;
  }
}

/** Reset permissions di Redis. */
async function deletePermissionsFromApi() {
  try {
    const res = await fetch("/api/permissions", { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Permissions] Gagal reset di Redis:", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Permissions] Gagal reset di Redis:", err?.message);
    return false;
  }
}

// ----------------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------------

export function UserTypeProvider({ children }) {
  const envUserType = getEnvUserType();
  const currentHost = useSyncExternalStore(
    emptySubscribe,
    () => window.location.hostname,
    () => "",
  );
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [previewUserType, setPreviewUserType] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY_PREVIEW);
        if (saved && Object.values(USER_TYPES).includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return null;
  });
  const [permissions, setPermissions] = useState(() => getStoredPermissions());
  /** true = Redis aktif & berhasil fetch, false = mode lokal */
  const [redisActive, setRedisActive] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    // ── 1. Load permissions: prioritaskan cache localStorage, ambil dari Redis jika cache stale (> 10 mnt)
    async function initPermissions() {
      let lastSync = 0;
      try {
        const storedTime = window.localStorage.getItem(STORAGE_KEY_LAST_SYNC);
        if (storedTime) lastSync = parseInt(storedTime, 10) || 0;
      } catch {}

      const now = Date.now();
      const isCacheFresh = now - lastSync < SYNC_CACHE_TTL_MS;

      // Jika cache di localStorage masih fresh (< 10 menit), gunakan langsung tanpa HTTP call
      if (isCacheFresh) {
        setPermissions(getStoredPermissions());
        setRedisActive(true);
        return;
      }

      // Cache kadaluarsa atau belum ada -> fetch dari Redis
      const remote = await fetchPermissionsFromApi();
      if (!isSubscribed) return;

      if (remote) {
        setPermissions(remote);
        setRedisActive(true);
        try {
          saveStoredPermissions(remote);
          window.localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(Date.now()));
        } catch {}
      } else {
        setPermissions(getStoredPermissions());
        setRedisActive(false);
      }
    }

    initPermissions();

    // ── 2. Event listeners untuk cross-tab sync realtime lokal (0 HTTP request)
    const handlePermissionsChange = (e) => {
      if (e?.detail) {
        setPermissions(e.detail);
      } else {
        setPermissions(getStoredPermissions());
      }
    };

    window.addEventListener(PERMISSIONS_CHANGE_EVENT, handlePermissionsChange);
    window.addEventListener("storage", handlePermissionsChange);

    return () => {
      isSubscribed = false;
      window.removeEventListener(PERMISSIONS_CHANGE_EVENT, handlePermissionsChange);
      window.removeEventListener("storage", handlePermissionsChange);
    };
  }, []);

  const isAdmin = envUserType === USER_TYPES.ADMIN;
  const activeUserType = isAdmin && previewUserType ? previewUserType : envUserType;

  const setPreview = (targetType) => {
    if (!isAdmin) return;
    if (!targetType || targetType === USER_TYPES.ADMIN) {
      setPreviewUserType(null);
      try {
        window.sessionStorage.removeItem(STORAGE_KEY_PREVIEW);
      } catch {}
    } else if (Object.values(USER_TYPES).includes(targetType)) {
      setPreviewUserType(targetType);
      try {
        window.sessionStorage.setItem(STORAGE_KEY_PREVIEW, targetType);
      } catch {}
    }
  };

  const isAllowed = (href) => {
    return isRouteAllowed(href, activeUserType, permissions);
  };

  const isFeatureAllowed = (featureId) => {
    return checkFeatureAllowed(featureId, activeUserType, permissions);
  };

  /**
   * Simpan ke localStorage + sinkronkan ke Redis (fire-and-forget).
   * @param {Object} newPermissions
   */
  const persistPermissions = (newPermissions) => {
    // 1. Update localStorage (immediate, offline-safe)
    saveStoredPermissions(newPermissions);
    try {
      window.localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(Date.now()));
    } catch {}
    // 2. Sinkronkan ke Redis (async, non-blocking)
    pushPermissionsToApi(newPermissions).then((ok) => {
      if (!ok && redisActive) {
        console.warn("[Permissions] Redis sync gagal, perubahan hanya tersimpan lokal.");
      }
    });
  };

  const toggleRoute = (targetType, routeHref, allow) => {
    if (!isAdmin) return;
    const current = { ...permissions };
    const targetConfig = current[targetType] || { allowedRoutes: [], features: {} };
    const currentList = Array.isArray(targetConfig.allowedRoutes)
      ? [...targetConfig.allowedRoutes]
      : [];

    let updatedList;
    if (allow) {
      updatedList = Array.from(new Set([...currentList, routeHref]));
    } else {
      updatedList = currentList.filter((item) => item !== routeHref);
    }

    const newPermissions = {
      ...current,
      [targetType]: {
        ...targetConfig,
        allowedRoutes: updatedList,
      },
    };

    setPermissions(newPermissions);
    persistPermissions(newPermissions);
  };

  const toggleFeature = (targetType, featureId, isEnabled) => {
    if (!isAdmin) return;
    const current = { ...permissions };
    const targetConfig = current[targetType] || { allowedRoutes: [], features: {} };
    const currentFeatures = targetConfig.features ? { ...targetConfig.features } : {};

    currentFeatures[featureId] = Boolean(isEnabled);

    const newPermissions = {
      ...current,
      [targetType]: {
        ...targetConfig,
        features: currentFeatures,
      },
    };

    setPermissions(newPermissions);
    persistPermissions(newPermissions);
  };

  /**
   * Ganti seluruh allowedRoutes untuk satu targetType sekaligus (atomic batch).
   * Persist ke localStorage + Redis hanya SATU kali.
   * @param {string} targetType - "COMPLETED" | "ALLOCATION"
   * @param {string[]} newRoutes - array href yang ingin di-allow
   */
  const setRoutesForType = (targetType, newRoutes) => {
    if (!isAdmin) return;
    const current = { ...permissions };
    const targetConfig = current[targetType] || { allowedRoutes: [], features: {} };

    const newPermissions = {
      ...current,
      [targetType]: {
        ...targetConfig,
        allowedRoutes: Array.from(new Set(newRoutes)),
      },
    };

    setPermissions(newPermissions);
    persistPermissions(newPermissions);
  };

  const resetAll = () => {
    if (!isAdmin) return;
    resetStoredPermissions();
    setPermissions(DEFAULT_USER_TYPE_PERMISSIONS);
    try {
      window.localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
    } catch {}
    // Reset di Redis juga
    deletePermissionsFromApi();
  };

  /** Ambil paksa permissions terbaru dari Redis (misal saat ditekan tombol refresh manual) */
  const refreshFromRedis = async () => {
    const remote = await fetchPermissionsFromApi();
    if (remote) {
      setPermissions(remote);
      setRedisActive(true);
      try {
        saveStoredPermissions(remote);
        window.localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(Date.now()));
      } catch {}
      return true;
    }
    return false;
  };

  const value = {
    envUserType,
    currentHost,
    activeUserType,
    previewUserType,
    isAdmin,
    isPreviewing: Boolean(isAdmin && previewUserType),
    permissions,
    isAllowed,
    isFeatureAllowed,
    toggleRoute,
    toggleFeature,
    setRoutesForType,
    resetAll,
    refreshFromRedis,
    setPreview,
    mounted,
    redisActive,
  };

  return <UserTypeContext.Provider value={value}>{children}</UserTypeContext.Provider>;
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (!context) {
    // Graceful fallback untuk SSR / tests
    const envType = getEnvUserType();
    return {
      envUserType: envType,
      currentHost: "",
      activeUserType: envType,
      previewUserType: null,
      isAdmin: envType === USER_TYPES.ADMIN,
      isPreviewing: false,
      permissions: DEFAULT_USER_TYPE_PERMISSIONS,
      isAllowed: (href) => isRouteAllowed(href, envType, DEFAULT_USER_TYPE_PERMISSIONS),
      isFeatureAllowed: (featureId) =>
        checkFeatureAllowed(featureId, envType, DEFAULT_USER_TYPE_PERMISSIONS),
      toggleRoute: () => {},
      toggleFeature: () => {},
      setRoutesForType: () => {},
      resetAll: () => {},
      refreshFromRedis: async () => false,
      setPreview: () => {},
      mounted: false,
      redisActive: false,
    };
  }
  return context;
}
