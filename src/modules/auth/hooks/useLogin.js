// ============================================================================
// MODULES / AUTH — useLogin Hook
// Purpose: Form state management, validation, and submission logic for login
// ============================================================================

"use client";

import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AUTH_MESSAGES, DEFAULT_REDIRECT_URL } from "../constants/auth.constants";
import { loginSchema } from "../schemas/login.schema";
import { authService } from "../services/auth.service";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const result = await authService.login(values);

      if (result?.isNeedChangePass) {
        toast.add({
          title: "Peringatan",
          description: AUTH_MESSAGES.NEED_CHANGE_PASSWORD,
          type: "warning",
        });
      } else {
        toast.add({
          title: "Sukses",
          description: AUTH_MESSAGES.SUCCESS,
          type: "success",
        });
      }

      const nextUrl = searchParams.get("next");
      const target =
        nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
          ? nextUrl
          : DEFAULT_REDIRECT_URL;

      router.replace(target);
      router.refresh();
    } catch (error) {
      let message = AUTH_MESSAGES.GENERIC_ERROR;

      if (error?.status === 401) {
        message = AUTH_MESSAGES.INVALID_CREDENTIALS;
      } else if (error?.status === 403) {
        message = AUTH_MESSAGES.INACTIVE_ACCOUNT;
      } else if (error?.status === 429) {
        message = AUTH_MESSAGES.RATE_LIMIT_ERROR;
      } else if (
        error?.code === "ECONNABORTED" ||
        error?.message?.toLowerCase().includes("timeout")
      ) {
        message = AUTH_MESSAGES.TIMEOUT_ERROR;
      } else if (error?.message && !error.message.includes("Network Error")) {
        message = error.message;
      } else if (error?.message?.includes("Network Error") || !navigator.onLine) {
        message = AUTH_MESSAGES.NETWORK_ERROR;
      }

      setServerError(message);
      toast.add({
        title: "Gagal Login",
        description: message,
        type: "error",
      });
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    serverError,
  };
}
