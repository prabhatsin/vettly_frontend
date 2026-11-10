"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Participant, RemoteTrack, Room } from "livekit-client";
import { apiFetch } from "@/lib/api";
import { testMicrophone } from "@/lib/readiness";
import type { InterviewToken } from "@/lib/types";

export type RoomPhase =
  | "idle" // pre-join
  | "connecting" // getting a token and joining
  | "waiting" // in the room, waiting for Iris
  | "live"
  | "ended" // Iris closed the interview, or the candidate ended it
  | "failed"; // see `failure`

export type Failure = "mic" | "token" | "connect" | "agent_timeout" | "dropped";

export type AgentState = "initializing" | "listening" | "thinking" | "speaking" | null;

const AGENT_JOIN_TIMEOUT_MS = 20_000;

/** Joins the LiveKit room for one interview and tracks who is speaking. */
export function useInterviewRoom(applicationId: string) {
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);
  const agentTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [phase, setPhase] = useState<RoomPhase>("idle");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [agentPresent, setAgentPresent] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [youSpeaking, setYouSpeaking] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  /** Who ended it: Iris finishing marks the interview done; the candidate leaving keeps it open. */
  const [endedBy, setEndedBy] = useState<"agent" | "candidate" | null>(null);

  const fail = useCallback((kind: Failure, text: string) => {
    clearTimeout(agentTimer.current);
    setFailure(kind);
    setMessage(text);
    setPhase("failed");
  }, []);

  const teardown = useCallback(async () => {
    clearTimeout(agentTimer.current);
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      endingRef.current = true;
      await room.disconnect();
    }
    audioRef.current?.replaceChildren();
    setAgentPresent(false);
    setAgentSpeaking(false);
    setYouSpeaking(false);
    setAgentState(null);
    setReconnecting(false);
  }, []);

  const start = useCallback(async () => {
    if (roomRef.current) return;
    setFailure(null);
    setMessage(null);
    setPhase("connecting");
    endingRef.current = false;

    const mic = await testMicrophone();
    if (!mic.ok) {
      fail("mic", mic.message ?? "Microphone access is needed for the interview.");
      return;
    }

    let creds: InterviewToken;
    try {
      creds = await apiFetch<InterviewToken>(`/applications/${applicationId}/interview-token`, {
        method: "POST",
      });
    } catch (err) {
      fail("token", err instanceof Error ? err.message : "Couldn't start the interview.");
      return;
    }

    const { Room, RoomEvent, Track } = await import("livekit-client");
    const room = new Room({ adaptiveStream: false, dynacast: false });
    roomRef.current = room;

    const isAgent = (p: Participant) => p.isAgent;
    const readAgentState = (p: Participant) => {
      const s = p.attributes?.["lk.agent.state"];
      setAgentState((s as AgentState) ?? null);
    };
    const agentJoined = (p: Participant) => {
      clearTimeout(agentTimer.current);
      setAgentPresent(true);
      readAgentState(p);
      setStartedAt((t) => t ?? Date.now());
      setPhase("live");
    };

    room
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach();
        audioRef.current?.appendChild(el);
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach().forEach((el) => el.remove());
      })
      .on(RoomEvent.ParticipantConnected, (p) => {
        if (isAgent(p)) agentJoined(p);
      })
      .on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
        if (isAgent(p)) readAgentState(p);
      })
      .on(RoomEvent.ParticipantDisconnected, (p) => {
        if (!isAgent(p)) return;
        // Iris leaves when the interview is over (finished, or the time limit).
        setAgentPresent(false);
        setEndedBy("agent");
        setPhase("ended");
        void teardown();
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setAgentSpeaking(speakers.some(isAgent));
        setYouSpeaking(speakers.some((s) => s.identity === room.localParticipant.identity));
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setAudioBlocked(!room.canPlaybackAudio);
      })
      .on(RoomEvent.Reconnecting, () => setReconnecting(true))
      .on(RoomEvent.Reconnected, () => setReconnecting(false))
      .on(RoomEvent.Disconnected, () => {
        if (endingRef.current) return;
        roomRef.current = null;
        audioRef.current?.replaceChildren();
        setAgentPresent(false);
        fail(
          "dropped",
          "The connection dropped. Rejoin to continue. Your interview picks up where it left off.",
        );
      })
      .on(RoomEvent.MediaDevicesError, () => {
        setMessage("There's a problem with your microphone. Check it's connected and allowed.");
      });

    try {
      await room.connect(creds.url, creds.token);
    } catch {
      roomRef.current = null;
      fail("connect", "Couldn't connect to the interview room. Check your connection and try again.");
      return;
    }

    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch {
      await teardown();
      fail("mic", "Couldn't turn on your microphone. Allow microphone access and try again.");
      return;
    }

    setAudioBlocked(!room.canPlaybackAudio);
    const agent = [...room.remoteParticipants.values()].find(isAgent);
    if (agent) {
      agentJoined(agent);
    } else {
      setPhase("waiting");
      agentTimer.current = setTimeout(() => {
        void teardown().then(() =>
          fail(
            "agent_timeout",
            "Iris didn't join the room. This is usually temporary. Try again in a moment.",
          ),
        );
      }, AGENT_JOIN_TIMEOUT_MS);
    }
  }, [applicationId, fail, teardown]);

  /** The candidate ends the interview. */
  const end = useCallback(async () => {
    await teardown();
    setEndedBy("candidate");
    setPhase("ended");
  }, [teardown]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  const enableAudio = useCallback(async () => {
    await roomRef.current?.startAudio();
    setAudioBlocked(!(roomRef.current?.canPlaybackAudio ?? true));
  }, []);

  // Leave the room when the page goes away (unmount, or hidden by navigation).
  useEffect(() => {
    return () => {
      clearTimeout(agentTimer.current);
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        endingRef.current = true;
        void room.disconnect();
      }
      // If the page comes back (kept alive by navigation), start from the pre-join screen.
      setPhase((p) => (p === "connecting" || p === "waiting" || p === "live" ? "idle" : p));
    };
  }, []);

  return {
    phase,
    failure,
    message,
    agentPresent,
    agentSpeaking,
    youSpeaking,
    agentState,
    reconnecting,
    audioBlocked,
    muted,
    startedAt,
    endedBy,
    audioRef,
    start,
    end,
    toggleMute,
    enableAudio,
    reset: () => {
      setPhase("idle");
      setFailure(null);
      setMessage(null);
    },
  };
}
