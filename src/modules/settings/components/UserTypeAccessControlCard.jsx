"use client";

import { Typography } from "@/components/elements/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import {
  CONTROLLABLE_FEATURES,
  CONTROLLABLE_ROUTES,
  DEFAULT_USER_TYPE_PERMISSIONS,
  USER_TYPES,
} from "@/lib/permissions";
import { useUserType } from "@/lib/permissions/UserTypeProvider";
import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const ROLES = [USER_TYPES.COMPLETED, USER_TYPES.ALLOCATION];

const MATRIX_COLS = "md:grid-cols-[minmax(0,1fr)_6rem_6rem] lg:grid-cols-[minmax(0,1fr)_8rem_8rem]";

const ROLE_LABELS = {
  [USER_TYPES.COMPLETED]: "Completed",
  [USER_TYPES.ALLOCATION]: "Allocation",
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role;

// -----------------------------------------------------------------------------
// Presentational helpers
// -----------------------------------------------------------------------------

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {description && (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Header kolom
function MatrixHeader({ firstLabel }) {
  return (
    <div
      className={`hidden items-center gap-4 border-b bg-muted/40 px-4 py-2.5 md:grid ${MATRIX_COLS}`}
    >
      <span className="text-xs font-medium text-muted-foreground">{firstLabel}</span>

      {ROLES.map((role) => (
        <span key={role} className="text-center text-xs font-medium text-muted-foreground">
          {getRoleLabel(role)}
        </span>
      ))}
    </div>
  );
}

// Switch akses
function ToggleCell({ role, checked, onChange, ariaLabel }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 md:justify-center md:border-0 md:bg-transparent md:p-0">
      <span className="text-xs font-medium text-muted-foreground md:sr-only">
        {getRoleLabel(role)}
      </span>

      <Switch checked={checked} onCheckedChange={onChange} aria-label={ariaLabel} />
    </div>
  );
}

function MatrixRow({ title, code, description, hint, values, onChange, ariaPrefix }) {
  return (
    <div
      className={`grid gap-3 px-4 py-4 transition-colors hover:bg-muted/40 md:items-center md:gap-4 ${MATRIX_COLS}`}
    >
      <div className="min-w-0 space-y-1">
        <Typography as="small">{title}</Typography>

        {description && (
          <Typography as="p" className="text-xs text-muted-foreground">
            {description}
          </Typography>
        )}

        {/* {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>} */}

        {code && (
          <Typography as="code" className="bg-muted text-[10px] font-normal text-muted-foreground">
            {code}
          </Typography>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:contents">
        {ROLES.map((role) => (
          <ToggleCell
            key={role}
            role={role}
            checked={values[role]}
            onChange={(checked) => onChange(role, checked)}
            ariaLabel={`${ariaPrefix} untuk tim ${getRoleLabel(role)}`}
          />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function UserTypeAccessControlCard() {
  const {
    previewUserType,
    isAdmin,
    isPreviewing,
    permissions,
    toggleRoute,
    toggleFeature,
    setRoutesForType,
    resetAll,
    setPreview,
  } = useUserType();

  // Hanya admin yang dapat mengatur hak akses.
  if (!isAdmin) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFeatureToggle = (targetType, featureId, isChecked) => {
    toggleFeature(targetType, featureId, isChecked);

    const feature = CONTROLLABLE_FEATURES.find((item) => item.id === featureId);

    const featureName = feature?.label || featureId;
    const roleLabel = getRoleLabel(targetType);

    toast.add({
      type: isChecked ? "success" : "info",
      title: isChecked ? "Fitur Diaktifkan" : "Fitur Dinonaktifkan",
      description: isChecked
        ? `${featureName} kini tersedia untuk tim ${roleLabel}.`
        : `${featureName} tidak lagi tersedia untuk tim ${roleLabel}.`,
    });
  };

  const handleToggle = (targetType, routeHref, isChecked) => {
    toggleRoute(targetType, routeHref, isChecked);

    const route = CONTROLLABLE_ROUTES.find((item) => item.href === routeHref);

    const pageName = route?.label || routeHref;
    const roleLabel = getRoleLabel(targetType);

    toast.add({
      type: isChecked ? "success" : "info",
      title: isChecked ? "Akses Halaman Diaktifkan" : "Akses Halaman Dinonaktifkan",
      description: isChecked
        ? `Tim ${roleLabel} kini dapat mengakses ${pageName}.`
        : `Tim ${roleLabel} tidak lagi dapat mengakses ${pageName}.`,
    });
  };

  // Aktifkan semua halaman untuk satu tim.
  const handleEnableAll = (targetType) => {
    const allHrefs = CONTROLLABLE_ROUTES.map((route) => route.href);

    setRoutesForType(targetType, allHrefs);

    toast.add({
      type: "success",
      title: "Semua Halaman Diaktifkan",
      description: `Tim ${getRoleLabel(targetType)} kini dapat mengakses semua halaman.`,
    });
  };

  // Reset halaman ke pengaturan default.
  const handleResetRoutes = (targetType) => {
    const defaults = DEFAULT_USER_TYPE_PERMISSIONS[targetType]?.allowedRoutes ?? [];

    setRoutesForType(targetType, defaults);

    toast.add({
      type: "info",
      title: "Akses Dikembalikan",
      description: `Pengaturan halaman tim ${getRoleLabel(targetType)} dikembalikan ke default.`,
    });
  };

  // Reset seluruh pengaturan akses.
  const handleResetToDefault = () => {
    resetAll();

    toast.add({
      type: "success",
      title: "Pengaturan Direset",
      description: "Semua hak akses dikembalikan ke pengaturan default.",
    });
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const groups = Array.from(new Set(CONTROLLABLE_ROUTES.map((route) => route.group)));

  const totalRoutes = CONTROLLABLE_ROUTES.length;

  const isRouteAllowed = (role, href) => (permissions[role]?.allowedRoutes || []).includes(href);

  const countAllowed = (role, routes = CONTROLLABLE_ROUTES) =>
    routes.filter((route) => isRouteAllowed(role, route.href)).length;

  const previewOptions = [
    {
      type: USER_TYPES.ADMIN,
      label: "Admin",
      selected: !isPreviewing,
    },
    {
      type: USER_TYPES.COMPLETED,
      label: "Completed",
      selected: previewUserType === USER_TYPES.COMPLETED,
    },
    {
      type: USER_TYPES.ALLOCATION,
      label: "Allocation",
      selected: previewUserType === USER_TYPES.ALLOCATION,
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={SecurityLockIcon} className="size-5 shrink-0" />
              Pengaturan Akses
            </CardTitle>

            <CardDescription>
              Atur akses halaman dan fitur untuk tim Completed dan Allocation.
            </CardDescription>
          </div>

          {/* Pratinjau tipe pengguna */}
          <div
            role="group"
            aria-label="Lihat sebagai"
            className="grid w-full grid-cols-3 gap-1 rounded-full border bg-muted/40 p-1 lg:w-auto lg:min-w-56"
          >
            {previewOptions.map((option) => (
              <Button
                key={option.type}
                size="sm"
                variant={option.selected ? "default" : "ghost"}
                aria-pressed={option.selected}
                onClick={() => setPreview(option.type)}
                className={`h-7 w-full rounded-full text-xs font-medium ${
                  option.selected ? "" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 -mt-4">
        {/* Ringkasan akses */}
        <section className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => {
            const allowed = countAllowed(role);

            const percentage = totalRoutes ? Math.round((allowed / totalRoutes) * 100) : 0;

            return (
              <div key={role} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Team {getRoleLabel(role)}</p>

                  <p className="text-sm text-muted-foreground">
                    {allowed} dari {totalRoutes} halaman aktif
                  </p>
                </div>

                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={allowed}
                  aria-valuemin={0}
                  aria-valuemax={totalRoutes}
                  aria-label={`Halaman aktif untuk tim ${getRoleLabel(role)}`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleEnableAll(role)}
                  >
                    Aktifkan semua
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => handleResetRoutes(role)}
                  >
                    Reset ke default
                  </Button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Pengaturan tombol dan fitur */}
        <section className="space-y-4">
          <SectionTitle
            title="Tombol dan Fitur"
            description="Atur tombol dan fitur yang dapat digunakan oleh setiap tim."
          />

          <div className="overflow-hidden rounded-xl border bg-card">
            <MatrixHeader firstLabel="Fitur" />

            <div className="divide-y">
              {CONTROLLABLE_FEATURES.map((feature) => {
                const values = Object.fromEntries(
                  ROLES.map((role) => [role, permissions[role]?.features?.[feature.id] ?? false]),
                );

                return (
                  <MatrixRow
                    key={feature.id}
                    title={feature.label}
                    code={feature.location}
                    description={feature.description}
                    hint={
                      feature.actionType === "disable_hide"
                        ? "Nonaktifkan untuk menyembunyikan tombol."
                        : "Nonaktifkan untuk membatasi penggunaan tombol."
                    }
                    values={values}
                    onChange={(role, checked) => handleFeatureToggle(role, feature.id, checked)}
                    ariaPrefix={`Fitur ${feature.label}`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Pengaturan akses halaman */}
        <section className="space-y-4">
          <SectionTitle
            title="Akses Halaman"
            description="Atur halaman yang dapat diakses oleh setiap tim. Nonaktifkan switch untuk menyembunyikan dan membatasi akses halaman."
          />

          <div className="space-y-3">
            {groups.map((groupName) => {
              const routesInGroup = CONTROLLABLE_ROUTES.filter(
                (route) => route.group === groupName,
              );

              return (
                <details
                  key={groupName}
                  open
                  className="group overflow-hidden rounded-xl border bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-sm font-semibold text-foreground">{groupName}</span>

                      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {ROLES.map((role) => (
                          <span key={role}>
                            {getRoleLabel(role)} {countAllowed(role, routesInGroup)}/
                            {routesInGroup.length}
                          </span>
                        ))}
                      </p>
                    </div>

                    <Chevron />
                  </summary>

                  <div className="border-t">
                    <MatrixHeader firstLabel="Halaman" />

                    <div className="divide-y">
                      {routesInGroup.map((route) => {
                        const values = Object.fromEntries(
                          ROLES.map((role) => [role, isRouteAllowed(role, route.href)]),
                        );

                        return (
                          <MatrixRow
                            key={route.href}
                            title={route.label}
                            code={route.href}
                            description={route.description}
                            values={values}
                            onChange={(role, checked) => handleToggle(role, route.href, checked)}
                            ariaPrefix={`Akses ${route.label}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default UserTypeAccessControlCard;
