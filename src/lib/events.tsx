"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/token";
import type { LiveEvent } from "@/lib/types";

/** `null` means "the stream reconnected, refetch in case something was missed". */
type Listener = (event: LiveEvent | null) => void;

interface EventsContextValue {
  subscribe: (fn: Listener) => () => void;
  connected: boolean;
}

const EventsContext = createContext<EventsContextValue | null>(null);

/**
 * One shared SSE connection for the whole signed-in app. It is mounted inside
 * the app shell, so it opens after login and closes on logout (a full reload).
 */
export function EventsProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);
  const [value] = useState<Omit<EventsContextValue, "connected">>(() => ({
    subscribe(fn: Listener) {
      listeners.current.add(fn);
      return () => {
        listeners.current.delete(fn);
      };
    },
  }));

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    const token = getToken();
    if (!base || !token) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let hadError = false;
    let stopped = false;

    const emit = (event: LiveEvent | null) => {
      listeners.current.forEach((fn) => fn(event));
    };

    const open = () => {
      const current = getToken();
      if (stopped || !current) return;
      source = new EventSource(`${base}/events/stream?token=${encodeURIComponent(current)}`);
      source.onopen = () => {
        setConnected(true);
        if (hadError) emit(null);
        hadError = false;
      };
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as LiveEvent;
          if (data && data.type === "notification") emit(data);
        } catch {
          // Ignore anything that isn't JSON.
        }
      };
      source.onerror = () => {
        setConnected(false);
        hadError = true;
        // The browser retries on its own unless the stream was closed for good.
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          retryTimer = setTimeout(open, 5000);
        }
      };
    };

    open();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  return <EventsContext.Provider value={{ ...value, connected }}>{children}</EventsContext.Provider>;
}

export function useEventsStatus(): boolean {
  return useContext(EventsContext)?.connected ?? false;
}

/** Calls `handler` on every live event (and on reconnect, with `null`). */
export function useLiveEvent(handler: Listener) {
  const ctx = useContext(EventsContext);
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe((e) => ref.current(e));
  }, [ctx]);
}
