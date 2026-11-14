import { beforeEach, describe, expect, it } from "vitest";
import {
  CONTROLLABLE_ROUTES,
  DEFAULT_USER_TYPE_PERMISSIONS,
  DOMAIN_USER_TYPE_MAP,
  USER_TYPES,
  getEffectiveUserType,
  getEnvUserType,
  isFeatureAllowed,
  isRouteAllowed,
  resolveUserTypeFromDomain,
} from "./index";

describe("User Types & Permissions logic", () => {
  const originalEnv = process.env.NEXT_PUBLIC_USER_TYPE;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_USER_TYPE;
  });

  it("resolves user type automatically based on domain name", () => {
    // Allocation subdomains: ri1 through ri6
    expect(resolveUserTypeFromDomain("ri1.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("ri2.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("ri3.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("ri4.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("ri5.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("ri6.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);

    expect(resolveUserTypeFromDomain("timcomplete.jossjiss.ai.id")).toBe(USER_TYPES.COMPLETED);
    expect(resolveUserTypeFromDomain("admin.jossjiss.ai.id")).toBe(USER_TYPES.ADMIN);

    // Port or uppercase handling
    expect(resolveUserTypeFromDomain("RI3.JOSSJISS.AI.ID:3000")).toBe(USER_TYPES.ALLOCATION);
    expect(resolveUserTypeFromDomain("unknown.domain.com")).toBe(null);
  });

  it("getEffectiveUserType resolves from serverHost or env", () => {
    expect(getEffectiveUserType("ri2.jossjiss.ai.id")).toBe(USER_TYPES.ALLOCATION);
    expect(getEffectiveUserType("timcomplete.jossjiss.ai.id")).toBe(USER_TYPES.COMPLETED);
    expect(getEffectiveUserType("admin.jossjiss.ai.id")).toBe(USER_TYPES.ADMIN);

    // When host is unmapped, fallback to env variable or ADMIN
    process.env.NEXT_PUBLIC_USER_TYPE = "COMPLETED";
    expect(getEffectiveUserType("localhost")).toBe(USER_TYPES.COMPLETED);
  });

  it("getEnvUserType defaults to ADMIN when unset", () => {
    expect(getEnvUserType()).toBe(USER_TYPES.ADMIN);
  });

  it("getEnvUserType resolves COMPLETED and ALLOCATION properly", () => {
    process.env.NEXT_PUBLIC_USER_TYPE = "COMPLETED";
    expect(getEnvUserType()).toBe(USER_TYPES.COMPLETED);

    process.env.NEXT_PUBLIC_USER_TYPE = "allocation";
    expect(getEnvUserType()).toBe(USER_TYPES.ALLOCATION);

    process.env.NEXT_PUBLIC_USER_TYPE = "UNKNOWN";
    expect(getEnvUserType()).toBe(USER_TYPES.ADMIN);
  });

  it("all user types can access all routes by default", () => {
    for (const route of CONTROLLABLE_ROUTES) {
      expect(isRouteAllowed(route.href, USER_TYPES.ADMIN)).toBe(true);
      expect(isRouteAllowed(route.href, USER_TYPES.COMPLETED)).toBe(true);
      expect(isRouteAllowed(route.href, USER_TYPES.ALLOCATION)).toBe(true);
    }
  });

  it("isFeatureAllowed controls specific features per user type", () => {
    // Admin always has all features enabled
    expect(isFeatureAllowed("syncGoogleSheet", USER_TYPES.ADMIN)).toBe(true);
    expect(isFeatureAllowed("actionDatesExtend", USER_TYPES.ADMIN)).toBe(true);
    expect(isFeatureAllowed("actionDatesMove", USER_TYPES.ADMIN)).toBe(true);

    // COMPLETED: features are disabled by default
    expect(isFeatureAllowed("syncGoogleSheet", USER_TYPES.COMPLETED)).toBe(false);
    expect(isFeatureAllowed("actionDatesExtend", USER_TYPES.COMPLETED)).toBe(false);
    expect(isFeatureAllowed("actionDatesMove", USER_TYPES.COMPLETED)).toBe(false);

    // ALLOCATION: features are disabled by default
    expect(isFeatureAllowed("syncGoogleSheet", USER_TYPES.ALLOCATION)).toBe(false);
    expect(isFeatureAllowed("actionDatesExtend", USER_TYPES.ALLOCATION)).toBe(false);
    expect(isFeatureAllowed("actionDatesMove", USER_TYPES.ALLOCATION)).toBe(false);

    // Feature overrides work
    const customPermissions = {
      COMPLETED: {
        features: {
          syncGoogleSheet: true,
          actionDatesExtend: true,
        },
      },
    };
    expect(isFeatureAllowed("syncGoogleSheet", USER_TYPES.COMPLETED, customPermissions)).toBe(true);
    expect(isFeatureAllowed("actionDatesExtend", USER_TYPES.COMPLETED, customPermissions)).toBe(
      true,
    );
    expect(isFeatureAllowed("actionDatesMove", USER_TYPES.COMPLETED, customPermissions)).toBe(
      false,
    );
  });

  it("isRouteAllowed respects custom permission overrides", () => {
    const customPermissions = {
      COMPLETED: {
        allowedRoutes: ["/dashboard", "/dashboard/allocation"],
      },
    };

    expect(isRouteAllowed("/dashboard/allocation", USER_TYPES.COMPLETED, customPermissions)).toBe(
      true,
    );
    expect(isRouteAllowed("/dashboard/action-dates", USER_TYPES.COMPLETED, customPermissions)).toBe(
      false,
    );
  });
});
