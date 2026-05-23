import { useEffect, useMemo, useState } from "react";

import {
  enterSession,
  fetchNotice,
  fetchH5QuickQuestions,
  fetchPublicEvent,
  mapPublicToEvent,
  mapSessionToRunner,
  setStoredEventGuid,
} from "@/api/runner-api";
import { ApiError } from "@/lib/api-client";
import type { H5QuickQuestions } from "@/api/runner-api";
import { readPhaseOverride, resolveH5Phase } from "@/lib/event-phase";
import type { EventInfo, H5Phase, RunnerProfile } from "@/types";

const EMPTY_RUNNER: RunnerProfile = {
  id: "",
  name: "",
  bib: "",
  zone: "",
  bloodType: "",
  pickupWindow: "",
  pickupCounter: "",
  emergencyContact: "",
  emergencyPhone: "",
  checkInBefore: "",
};

const EMPTY_EVENT: EventInfo = {
  name: "",
  phase: "pre",
  preNotice: "",
  raceNotice: "",
  postNotice: "",
};

export interface RunnerContextState {
  runner: RunnerProfile;
  event: EventInfo;
  phase: H5Phase;
  greeting: string;
  eventGuid: string | null;
  eventStatus: string | null;
  h5QuickQuestions: H5QuickQuestions | null;
  aiEnabled: boolean;
  visitor: boolean;
  loading: boolean;
  error: string | null;
  apiConnected: boolean;
}

export function useRunnerContext(eventGuidFromRoute: string): RunnerContextState {
  const eventGuidParam = eventGuidFromRoute;
  const phaseOverride = useMemo(() => readPhaseOverride(), []);

  const [runner, setRunner] = useState<RunnerProfile>(EMPTY_RUNNER);
  const [event, setEvent] = useState<EventInfo>(EMPTY_EVENT);
  const [greeting, setGreeting] = useState("");
  const [eventGuid, setEventGuid] = useState<string | null>(eventGuidParam ?? null);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [h5QuickQuestions, setH5QuickQuestions] = useState<H5QuickQuestions | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [visitor, setVisitor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setApiConnected(false);

      try {
        setStoredEventGuid(eventGuidParam);

        const [pub, session, quickQuestions, notice] = await Promise.all([
          fetchPublicEvent(eventGuidParam),
          enterSession(eventGuidParam),
          fetchH5QuickQuestions(eventGuidParam),
          fetchNotice(eventGuidParam).catch(() => undefined),
        ]);

        if (cancelled) return;

        const r = mapSessionToRunner(session);
        const baseEvent = mapPublicToEvent(pub, notice);
        const phase = resolveH5Phase({
          eventDate: pub.eventDate,
          eventStatus: pub.status,
          apiPhase: pub.phase,
          phaseOverride,
        });
        const e = { ...baseEvent, phase };
        setRunner(r);
        setEvent(e);
        setGreeting(session.greeting ?? "");
        setEventGuid(pub.eventGuid);
        setEventStatus(pub.status ?? null);
        setH5QuickQuestions(quickQuestions);
        setAiEnabled(pub.aiEnabled);
        setVisitor(session.visitor === true);
        setApiConnected(true);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "无法连接选手端服务";
        setError(msg);
        setApiConnected(false);
        setRunner(EMPTY_RUNNER);
        setEvent(EMPTY_EVENT);
        setGreeting("");
        setEventGuid(eventGuidParam ?? null);
        setEventStatus(null);
        setH5QuickQuestions(null);
        setAiEnabled(false);
        setVisitor(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventGuidParam, phaseOverride]);

  const phase = resolveH5Phase({
    eventDate: event.eventDate,
    eventStatus: eventStatus,
    apiPhase: event.phase,
    phaseOverride,
  });

  return {
    runner,
    event: { ...event, phase },
    phase,
    greeting,
    eventGuid,
    eventStatus,
    h5QuickQuestions,
    aiEnabled,
    visitor,
    loading,
    error,
    apiConnected,
  };
}
