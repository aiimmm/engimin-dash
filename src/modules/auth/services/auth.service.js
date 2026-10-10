// ============================================================================
// MODULES / AUTH — Auth Service
// Purpose: API service for login operations
// ============================================================================

import { apiClient } from "@/lib/api/client";

export const authService = {
  /**
   * Submit user credentials to local proxy route
   * @param {Object} credentials
   * @param {string} credentials.username
   * @param {string} credentials.password
   * @returns {Promise<Object>}
   */
  async login(credentials) {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },
};
