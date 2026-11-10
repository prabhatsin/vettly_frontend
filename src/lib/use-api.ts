"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useLiveEvent } from "@/lib/events";

interface State<T> {
  key: string | null;
  data: T | undefined;
  error: ApiError | null;
}

export interface ApiResource<T> {
  data: T | undefined;
  error: ApiError | null;
  /** True until the first response (or error) for this path arrives. */
  loading: boolean;
  /** True while any request, including a background refetch, is running. */
  refreshing: boolean;
  reload: () => void;
}

/**
 * GETs `path` (skips when null). By default it refetches whenever a live
 * event arrives, so pages show fresh data without patching state by hand.
 */
export function useApi<T>(
  path: string | null,
  { live = true, pollMs = null }: { live?: boolean; pollMs?: number | null } = {},
): ApiResource<T> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null, data: undefined, error: null });
  const key = path ? `${path}#${nonce}` : null;

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    const requestKey = `${path}#${nonce}`;
    apiFetch<T>(path, { signal: ctrl.signal })
      .then((data) => setState({ key: requestKey, data, error: null }))
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        const error = err instanceof ApiError ? err : new ApiError(0, String(err));
        // Keep the last good data for the same path so a failed refetch doesn't blank the page.
        setState((prev) => ({
          key: requestKey,
          data: prev.key?.startsWith(`${path}#`) ? prev.data : undefined,
          error,
        }));
      });
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // Optional polling, for state changes that have no live event.
  useEffect(() => {
    if (!path || !pollMs) return;
    const t = setInterval(reload, pollMs);
    return () => clearInterval(t);
  }, [path, pollMs, reload]);

  useLiveEvent(() => {
    if (live && path) reload();
  });

  const samePath = !!path && !!state.key?.startsWith(`${path}#`);
  const data = samePath ? state.data : undefined;
  const error = samePath ? state.error : null;
  return {
    data,
    error,
    loading: !!path && data === undefined && !error,
    refreshing: !!path && state.key !== key,
    reload,
  };
}
