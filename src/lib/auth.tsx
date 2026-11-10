"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/token";
import type { RegisterRequest, TokenResponse, UserResponse } from "@/lib/types";

type AuthStatus = "loading" | "authed" | "anon";

interface AuthContextValue {
  user: UserResponse | null;
  status: AuthStatus;
  /** Set when the session check failed for a reason other than 401. */
  error: string | null;
  login: (email: string, password: string) => Promise<UserResponse>;
  register: (body: RegisterRequest) => Promise<UserResponse>;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/me");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      await Promise.resolve();
      if (!getToken()) {
        if (!cancelled) setStatus("anon");
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setError(null);
        setStatus("authed");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          setStatus("anon");
        } else {
          setError(err instanceof Error ? err.message : "Couldn't load your session.");
          setStatus("loading");
        }
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(access_token);
    try {
      const me = await fetchMe();
      setUser(me);
      setError(null);
      setStatus("authed");
      return me;
    } catch (err) {
      clearToken();
      throw err;
    }
  }, []);

  const register = useCallback(
    async (body: RegisterRequest) => {
      // Register returns the new user but no token, so log in right after.
      await apiFetch<UserResponse>("/auth/register", { method: "POST", body });
      return login(body.email, body.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearToken();
    // A full reload clears all client state, including routes kept alive by Activity.
    window.location.href = new URL("/login", window.location.origin).href;
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, register, logout, retry }),
    [user, status, error, login, register, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
