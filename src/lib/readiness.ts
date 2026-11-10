"use client";

import { useCallback, useEffect, useState } from "react";

export type CheckState = "idle" | "running" | "ok" | "failed";

const QUIET_KEY = "vettly_quiet_space";

function readQuiet(): boolean {
  try {
    return localStorage.getItem(QUIET_KEY) === "1";
  } catch {
    return false;
  }
}

/** Asks for the mic (shows the browser prompt if needed) and releases it again. */
export async function testMicrophone(): Promise<{ ok: boolean; message?: string }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      message: "This browser can't use a microphone. Try Chrome, Edge, Firefox or Safari.",
    };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return {
        ok: false,
        message: "Microphone access is blocked. Allow it from the icon in the address bar, then try again.",
      };
    }
    if (name === "NotFoundError")
      return { ok: false, message: "No microphone was found. Plug one in and try again." };
    return { ok: false, message: "Couldn't start the microphone. Close other apps using it and try again." };
  }
}

/**
 * Checks that this browser can run a LiveKit call (WebRTC) and that the API is reachable.
 * It does not request an interview token, because that starts preparing the interview.
 */
export async function testConnection(): Promise<{ ok: boolean; message?: string }> {
  const { isBrowserSupported } = await import("livekit-client");
  if (!isBrowserSupported()) {
    return {
      ok: false,
      message: "This browser doesn't support voice calls. Use a recent Chrome, Edge, Firefox or Safari.",
    };
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return { ok: true };
  } catch {
    return { ok: false, message: "Can't reach Vettly right now. Check your internet connection." };
  }
}

export function useReadiness() {
  const [mic, setMic] = useState<CheckState>("idle");
  const [connection, setConnection] = useState<CheckState>("idle");
  const [quiet, setQuietState] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Restore the checkbox, and mark the mic as tested if permission was already granted.
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setQuietState(readQuiet());
      try {
        const status = await navigator.permissions?.query({ name: "microphone" as PermissionName });
        if (!cancelled && status?.state === "granted") setMic((m) => (m === "idle" ? "ok" : m));
      } catch {
        // Not supported (e.g. Firefox): leave it for the user to test.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runMic = useCallback(async () => {
    setMic("running");
    const r = await testMicrophone();
    setMic(r.ok ? "ok" : "failed");
    setMessage(r.ok ? null : (r.message ?? null));
    return r.ok;
  }, []);

  const runConnection = useCallback(async () => {
    setConnection("running");
    const r = await testConnection();
    setConnection(r.ok ? "ok" : "failed");
    setMessage(r.ok ? null : (r.message ?? null));
    return r.ok;
  }, []);

  const runAll = useCallback(async () => {
    const micOk = await runMic();
    if (micOk) await runConnection();
  }, [runMic, runConnection]);

  const setQuiet = useCallback((value: boolean) => {
    setQuietState(value);
    try {
      localStorage.setItem(QUIET_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  return { mic, connection, quiet, message, runMic, runConnection, runAll, setQuiet };
}
