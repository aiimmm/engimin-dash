// ============================================================================
// MODULES / AUTH — Auth Constants
// Purpose: Centralized constants for authentication messages and routes
// ============================================================================

export const DEFAULT_REDIRECT_URL = "/dashboard";

export const AUTH_MESSAGES = {
  SUCCESS: "Login berhasil. Mengalihkan ke dashboard...",
  INVALID_CREDENTIALS: "Username atau password salah.",
  INACTIVE_ACCOUNT: "Akun Anda tidak aktif. Silakan hubungi administrator.",
  NEED_CHANGE_PASSWORD: "Anda harus memperbarui password sebelum melanjutkan.",
  NETWORK_ERROR: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
  TIMEOUT_ERROR: "Permintaan waktu habis. Silakan coba beberapa saat lagi.",
  RATE_LIMIT_ERROR: "Terlalu banyak percobaan login. Silakan tunggu beberapa saat.",
  SERVER_ERROR: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
  GENERIC_ERROR: "Gagal melakukan login. Silakan coba lagi.",
  REQUIRED_FIELDS: "Username dan password wajib diisi.",
};
