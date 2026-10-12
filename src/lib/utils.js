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
 * Format tanggal ke format lokal yang readable.
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Format tanggal dengan waktu.
 */
export function formatDateTime(dateString) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
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

/**
 * Truncate teks panjang dengan ellipsis.
 */
export function truncate(str, maxLength = 40) {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

export function compactDate(value) {
  if (!value) return "—";
  const text = String(value);
  if (/^\d{8}$/.test(text)) {
    const year = text.slice(0, 4);
    const month = text.slice(4, 6);
    const day = text.slice(6, 8);
    return `${day}/${month}/${year}`;
  }
  return text;
}

/**
 * Ubah teks (mis. "UNASSIGNED" atau "budi santoso") menjadi Title Case: "Unassigned", "Budi Santoso".
 * Aman dipakai untuk nilai kosong / placeholder seperti "—".
 */
export function toTitleCase(value) {
  if (!value) return value;
  return String(value)
    .toLowerCase()
    .replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

/**
 * Generate Work Order Tracing URL based on WO Number.
 * Format: https://liohd.travelio.com/web/workorder-tracing/#${woNum}
 */
export function getWorkOrderTracingUrl(woNumber) {
  const webUrl =
    process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || "https://liohd.travelio.com";
  const woNum = String(woNumber || "").trim();
  return `${webUrl}/web/workorder-tracing/#${woNum}`;
}

/**
 * Format angka ke format Rupiah (IDR).
 */
export function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}
