"use client";

import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";
import { useState } from "react";

export function useLoginForm() {
  const router = useRouter();
  const topLoader = useTopLoader();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.add({ type: "error", title: "Silakan isi username dan password" });
      return;
    }

    setLoading(true);

    const loginPromise = apiClient.post("/auth/login", { username, password }).then((res) => {
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Login gagal");
      }
      return res.data;
    });

    const toastPromise = toast.promise(loginPromise, {
      loading: { type: "loading", title: "Sedang masuk..." },
      success: { type: "success", title: "Login berhasil!" },
      error: (err) => ({ type: "error", title: err?.message || "Terjadi kesalahan saat login" }),
    });

    try {
      await toastPromise;
      topLoader.start();
      router.replace("/dashboard");
    } catch {
      // error sudah ditampilkan oleh toast.promise
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    loading,
    handleSubmit,
  };
}
