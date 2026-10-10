"use client";

import { apiClient } from "@/lib/api/client";
import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState({ user: null, loading: true });

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/auth/session")
      .then((res) => {
        if (isMounted) {
          setSession({ user: res.data?.user || null, loading: false });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession({ user: null, loading: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return session;
}
