// ============================================================================
// LIB / AUTH — /login
// Purpose: Zod validation schema for user login payload
// Description: Client & Server validation rules for username and password
// ============================================================================

import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(100, "Username terlalu panjang"),
  password: z.string().min(6, "Password minimal 6 karakter").max(200, "Password terlalu panjang"),
});
