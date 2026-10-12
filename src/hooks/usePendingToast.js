"use client";

import { toast } from "@/components/ui/toast";
import { useEffect } from "react";

const STORAGE_KEY = "pending_toast";

/**
 * Simpan toast ke sessionStorage agar bisa ditampilkan setelah navigasi/reload.
 * @param {{ type: string, title: string, description?: string }} options
 */
export function setPendingToast(options) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}

/**
 * Hook yang membaca pending toast dari sessionStorage saat mount,
 * menampilkannya, lalu langsung menghapusnya.
 * Pasang hook ini di halaman/layout tujuan navigasi.
 */
export function usePendingToast() {
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    sessionStorage.removeItem(STORAGE_KEY);

    try {
      const options = JSON.parse(raw);
      toast.add(options);
    } catch {
      // abaikan jika data tidak valid
    }
  }, []);
}
