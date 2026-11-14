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
// Helpers: Redis API calls
// ----------------------------------------------------------------------------

/** Ambil permissions dari /api/permissions (Redis). Null jika gagal. */
async function fetchPermissionsFromApi() {
  try {
    const res = await fetch("/api/permissions", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.permissions || null;
  } catch {
    return null;
  }
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

    // ── 1. Load permissions: coba dari Redis dulu, fallback localStorage
    async function loadPermissions() {
      const remote = await fetchPermissionsFromApi();
      if (!isSubscribed) return;

      if (remote) {
        // Redis berhasil → pakai remote, update localStorage sebagai cache
        setPermissions(remote);
        setRedisActive(true);
        try {
          saveStoredPermissions(remote); // sync ke localStorage (silent)
        } catch {}
      } else {
        // Redis gagal / tidak terkonfigurasi → pakai localStorage
        setPermissions(getStoredPermissions());
        setRedisActive(false);
      }
    }
    loadPermissions();

    // ── 2. Event listeners untuk cross-tab & live sync
    const handlePermissionsChange = (e) => {
      if (e?.detail) {
        setPermissions(e.detail);
      } else {
        setPermissions(getStoredPermissions());
      }
    };

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadPermissions();
      }
    };

    // Auto-refresh dari Redis setiap 30 detik
    const syncInterval = setInterval(() => {
      loadPermissions();
    }, 30_000);

    window.addEventListener(PERMISSIONS_CHANGE_EVENT, handlePermissionsChange);
    window.addEventListener("storage", handlePermissionsChange);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      isSubscribed = false;
      clearInterval(syncInterval);
      window.removeEventListener(PERMISSIONS_CHANGE_EVENT, handlePermissionsChange);
      window.removeEventListener("storage", handlePermissionsChange);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
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
    // Reset di Redis juga
    deletePermissionsFromApi();
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
      setPreview: () => {},
      mounted: false,
      redisActive: false,
    };
  }
  return context;
}
