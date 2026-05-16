import { useCallback, useState } from "react";
import type { ApiResponse } from "@/types";

export function useApi<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_api = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const result = (await response.json()) as ApiResponse<T>;

      if (!result.success) {
        throw new Error(result.error || "An error occurred");
      }

      setData(result.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, error, loading, fetch: fetch_api };
}

export function useFetch<T>(url: string, immediate = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(immediate);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      const result = (await response.json()) as ApiResponse<T>;

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch");
      }

      setData(result.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Auto-fetch on mount if immediate is true
  useCallback(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData])();

  return { data, error, loading, refetch: fetchData };
}

export function usePost<T>(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    async (body: any) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = (await response.json()) as ApiResponse<T>;

        if (!result.success) {
          throw new Error(result.error || "An error occurred");
        }

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { post, loading, error };
}

export function useCart() {
  const [itemCount, setItemCount] = useState(0);
  const [total, setTotal] = useState(0);

  const updateCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart");
      const result = (await response.json()) as ApiResponse<any>;

      if (result.success) {
        setItemCount(result.data.itemCount);
        setTotal(result.data.totalAmount);
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
    }
  }, []);

  return { itemCount, total, updateCart };
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setUser(result.data.user);
      // Store token in localStorage/cookie
      localStorage.setItem("token", result.data.token);

      return result.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "OTP verification failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  return { user, loading, error, login, verifyOtp, logout };
}
