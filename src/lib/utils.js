// ============================================================================
// LIB / API — Global Shared Utilities
// Purpose: General UI helper functions (Tailwind cn, date & text formatters)
// ============================================================================

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Mengambil inisial dari nama (maks 2 huruf).
 */
export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
