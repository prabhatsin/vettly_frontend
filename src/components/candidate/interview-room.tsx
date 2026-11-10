"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { ReadinessList } from "@/components/candidate/readiness-list";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/spinner";
import { ErrorState, Skeleton } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMyApplications } from "@/lib/candidate-data";
import { APPLICATION_STATUS } from "@/lib/format";
import { useReadiness } from "@/lib/readiness";
import { useInterviewRoom, type AgentState } from "@/lib/use-interview-room";
import { cn } from "@/lib/utils";

const LIMIT_SECONDS = 20 * 60;
const WRAPUP_AT_SECONDS = 17 * 60;

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function useElapsed(startedAt: number | null, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

function statusLine(agentSpeaking: boolean, youSpeaking: boolean, agentState: AgentState, muted: boolean) {
  if (agentSpeaking || agentState === "speaking") return "Iris is speaking";
  if (agentState === "thinking") return "Iris is thinking…";
  if (youSpeaking) return "Iris is listening to you";
  if (muted) return "You're muted";
  return "Your turn. Iris is listening";
}

function Avatar({
  label,
  initials,
  speaking,
  dark,
}: {
  label: string;
  initials: string;
  speaking: boolean;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <span
          aria-hidden
          className={cn(
            "absolute -inset-2 rounded-full border-2 transition-opacity duration-200",
            dark ? "border-hero-check" : "border-white/60",
            speaking ? "animate-pulse opacity-100" : "opacity-0",
          )}
        />
        <span
          className={cn(
            "inline-flex size-24 items-center justify-center rounded-full text-2xl font-semibold sm:size-28",
            dark ? "bg-white text-hero font-serif text-4xl font-normal" : "bg-white/10 text-white",
          )}
        >
          {initials}
        </span>
      </div>
      <p className="text-sm text-hero-muted">
        {label}
        {speaking && <span className="sr-only"> (speaking)</span>}
      </p>
    </div>
  );
}

export function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { applications, loading, error, reload } = useMyApplications();
  const app = applications?.find((a) => a.id === id);
  const { audioRef, ...room } = useInterviewRoom(id);
  const readiness = useReadiness();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const inRoom = room.phase === "waiting" || room.phase === "live";
  const elapsed = useElapsed(room.startedAt, room.phase === "live");

  // Warn before closing the tab mid-interview.
  useEffect(() => {
    if (!inRoom) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [inRoom]);

  // After the interview, go back to the applications page.
  useEffect(() => {
    if (room.phase !== "ended") return;
    const t = setTimeout(() => router.push("/candidate/interviews"), 4000);
    return () => clearTimeout(t);
  }, [room.phase, router]);

  if (loading) {
    return <Skeleton className="h-[520px] rounded-4xl" />;
  }
  if (error && !applications) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }
  if (!app) {
    return <ErrorState message="This interview doesn't exist or isn't yours." />;
  }

  const back = (
    <Link
      href="/candidate/interviews"
      className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      My applications
    </Link>
  );

  // Already interviewed (and not mid-session on this page).
  if (app.status !== "applied" && room.phase === "idle") {
    const meta = APPLICATION_STATUS[app.status];
    return (
      <div className="flex flex-col gap-8">
        {back}
        <div className="rounded-4xl bg-hero p-8 text-white sm:p-11">
          <p className="caption text-hero-caption">{app.jobTitle}</p>
          <h1 className="mt-4 text-[1.9rem] font-semibold tracking-tight">This interview is done</h1>
          <p className="mt-2 max-w-lg text-hero-muted">
            Your application is now <strong className="text-white">{meta.label.toLowerCase()}</strong>.
            {app.status === "interviewed"
              ? " Iris is scoring your answers. This page updates on its own."
              : ""}
          </p>
          <Link
            href="/candidate/interviews"
            className={cn(buttonVariants({ variant: "hero-primary", size: "lg" }), "mt-7")}
          >
            Back to my applications
          </Link>
        </div>
      </div>
    );
  }

  const remaining = LIMIT_SECONDS - elapsed;

  return (
    <div className="flex flex-col gap-8">
      {!inRoom && room.phase !== "ended" && back}

      <section
        aria-label="Interview room"
        className="relative overflow-hidden rounded-4xl bg-hero p-7 text-white sm:p-10 lg:p-11"
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="caption text-hero-caption">Voice interview with Iris</p>
            <h1 className="mt-3 text-[1.7rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
              {app.jobTitle}
            </h1>
            {app.job?.location && <p className="mt-1 text-hero-muted">{app.job.location} · about 20 min</p>}
          </div>
          {inRoom && (
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full",
                    room.agentPresent ? "bg-hero-check" : "animate-pulse bg-amber-300",
                  )}
                />
                {room.agentPresent ? "Iris connected" : "Waiting for Iris…"}
              </span>
              <span
                className="font-mono text-[1.6rem] tabular-nums"
                aria-label={`Elapsed ${formatClock(elapsed)}`}
              >
                {formatClock(elapsed)}
                <span className="text-base text-hero-caption"> / 20:00</span>
              </span>
            </div>
          )}
        </div>

        {/* Body by phase */}
        {room.phase === "idle" && (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-xl font-semibold">Before you start</h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-hero-muted">
                <li>
                  Iris will ask about your experience and the role. Answer out loud, as in a normal interview.
                </li>
                <li>It takes about 20 minutes. Iris starts wrapping up near the end.</li>
                <li>Use headphones if you can, and stay on this page until Iris says goodbye.</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="hero-primary" size="lg" onClick={room.start}>
                  <Mic />
                  Start interview
                </Button>
              </div>
            </div>
            <div>
              <p className="caption text-hero-caption">Readiness</p>
              <div className="mt-4">
                <ReadinessList
                  items={[
                    {
                      label: readiness.mic === "ok" ? "Microphone tested" : "Test microphone",
                      state: readiness.mic,
                      onClick: readiness.runMic,
                    },
                    { label: "Résumé uploaded", state: true },
                    {
                      label: "Quiet space confirmed",
                      state: readiness.quiet,
                      onClick: () => readiness.setQuiet(!readiness.quiet),
                      hint: readiness.quiet ? undefined : "Tap to confirm",
                    },
                    {
                      label: readiness.connection === "ok" ? "Connection checked" : "Run connection check",
                      state: readiness.connection,
                      onClick: readiness.runConnection,
                    },
                  ]}
                />
              </div>
              {readiness.message && <p className="mt-4 text-sm text-[#f6c1b9]">{readiness.message}</p>}
            </div>
          </div>
        )}

        {room.phase === "connecting" && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Spinner className="size-7 text-hero-muted" />
            <p className="text-hero-muted">Connecting to the interview room…</p>
          </div>
        )}

        {inRoom && (
          <div className="mt-10 flex flex-col items-center gap-10">
            <div className="flex items-center justify-center gap-10 sm:gap-20">
              <Avatar label="Iris" initials="I" speaking={room.agentSpeaking} dark />
              <Avatar
                label={room.muted ? "You (muted)" : "You"}
                initials="You"
                speaking={room.youSpeaking && !room.muted}
              />
            </div>

            <p className="text-lg" aria-live="polite">
              {room.phase === "waiting"
                ? "Iris is joining. This usually takes a few seconds…"
                : statusLine(room.agentSpeaking, room.youSpeaking, room.agentState, room.muted)}
            </p>

            {room.reconnecting && (
              <p className="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm text-amber-200">
                <Spinner /> Connection unstable. Reconnecting…
              </p>
            )}
            {room.phase === "live" && remaining <= LIMIT_SECONDS - WRAPUP_AT_SECONDS && (
              <p className="rounded-2xl bg-amber-200/10 px-4 py-2.5 text-center text-sm text-amber-100">
                {remaining > 0
                  ? `About ${Math.max(1, Math.ceil(remaining / 60))} min left. Iris will start wrapping up.`
                  : "Time's up. Iris is closing the interview."}
              </p>
            )}
            {room.audioBlocked && (
              <Button variant="hero-primary" onClick={room.enableAudio}>
                <Volume2 />
                Tap to hear Iris
              </Button>
            )}
            {room.message && <p className="text-sm text-[#f6c1b9]">{room.message}</p>}

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="hero-outline"
                size="lg"
                onClick={room.toggleMute}
                disabled={room.phase !== "live"}
              >
                {room.muted ? <MicOff /> : <Mic />}
                {room.muted ? "Unmute" : "Mute"}
              </Button>
              <Button
                size="lg"
                className="bg-[#d9473a] text-white hover:bg-[#c23d31]"
                onClick={() => setConfirmEnd(true)}
              >
                <PhoneOff />
                End interview
              </Button>
            </div>
          </div>
        )}

        {room.phase === "ended" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <CheckCircle2 className="size-10 text-hero-check" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold">
              {room.endedBy === "candidate" ? "You left the interview" : "Interview finished"}
            </h2>
            <p className="max-w-md text-hero-muted">
              {room.endedBy === "candidate"
                ? "If Iris hadn't finished, the interview stays open. Join again from your applications to pick up where you left off."
                : "Thank you. Your application moves to Interviewed and then Scored shortly."}{" "}
              Taking you back to your applications…
            </p>
            <Link
              href="/candidate/interviews"
              className={buttonVariants({ variant: "hero-primary", size: "lg" })}
            >
              Go now
            </Link>
          </div>
        )}

        {room.phase === "failed" && (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <AlertTriangle className="size-9 text-amber-200" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold">
              {room.failure === "mic"
                ? "Microphone needed"
                : room.failure === "agent_timeout"
                  ? "Iris didn't join"
                  : room.failure === "dropped"
                    ? "Connection lost"
                    : "Couldn't start the interview"}
            </h2>
            <p className="max-w-md text-hero-muted">{room.message}</p>
            {room.failure === "mic" && (
              <p className="max-w-md text-sm text-hero-caption">
                Click the lock or microphone icon in your browser&apos;s address bar, allow the microphone,
                then try again.
              </p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button variant="hero-primary" size="lg" onClick={room.start}>
                <RefreshCw />
                {room.failure === "dropped" ? "Rejoin" : "Try again"}
              </Button>
              <Link
                href="/candidate/interviews"
                className={buttonVariants({ variant: "hero-outline", size: "lg" })}
              >
                Leave
              </Link>
            </div>
          </div>
        )}

        {/* Remote audio elements live here. */}
        <div ref={audioRef} hidden />
      </section>

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="End the interview?"
        description="You'll leave the room now. If Iris hasn't finished, the interview stays open and you can rejoin later to pick up where you left off."
        confirmLabel="End and leave"
        destructive
        onConfirm={room.end}
      />
    </div>
  );
}
