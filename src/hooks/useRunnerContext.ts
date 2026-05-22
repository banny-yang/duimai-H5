import { useEffect, useMemo, useState } from "react";

import {

  enterSession,

  fetchNotice,

  fetchPublicEvent,

  mapPublicToEvent,

  mapSessionToRunner,

  readEventGuidFromUrl,

  redirectLegacyEventGuidUrl,

  setStoredEventGuid,

} from "@/api/runner-api";

import { ApiError } from "@/lib/api-client";

import { MOCK_EVENT, MOCK_RUNNER } from "@/mock/data";

import type { EventInfo, RacePhase, RunnerProfile } from "@/types";



function readPhaseOverride(): RacePhase | undefined {

  const p = new URLSearchParams(window.location.search).get("phase");

  return p === "race" ? "race" : p === "pre" ? "pre" : undefined;

}



export interface RunnerContextState {

  runner: RunnerProfile;

  event: EventInfo;

  phase: RacePhase;

  greeting: string;

  eventGuid: string | null;

  aiEnabled: boolean;

  visitor: boolean;

  loading: boolean;

  error: string | null;

  apiConnected: boolean;

}



export function useRunnerContext(): RunnerContextState {

  redirectLegacyEventGuidUrl();

  const eventGuidParam = useMemo(() => readEventGuidFromUrl(), []);

  const phaseOverride = useMemo(() => readPhaseOverride(), []);



  const [runner, setRunner] = useState<RunnerProfile>(MOCK_RUNNER);

  const [event, setEvent] = useState<EventInfo>(MOCK_EVENT);

  const [greeting, setGreeting] = useState("");

  const [eventGuid, setEventGuid] = useState<string | null>(eventGuidParam ?? null);

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

      try {

        if (!eventGuidParam) {

          throw new ApiError("URL 缺少赛事 GUID，请使用 /{event_guid} 格式", 400);

        }

        setStoredEventGuid(eventGuidParam);



        const pub = await fetchPublicEvent(eventGuidParam);

        const session = await enterSession(eventGuidParam);

        const notice = await fetchNotice(eventGuidParam).catch(() => undefined);



        if (cancelled) return;



        const r = mapSessionToRunner(session);

        let e = mapPublicToEvent(pub, notice);

        if (phaseOverride) {

          e = { ...e, phase: phaseOverride };

        }

        setRunner(r);

        setEvent(e);

        setGreeting(session.greeting ?? "");

        setEventGuid(pub.eventGuid);

        setAiEnabled(pub.aiEnabled);

        setVisitor(session.visitor);

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

        const phase = phaseOverride ?? MOCK_EVENT.phase;

        setRunner(MOCK_RUNNER);

        setEvent({ ...MOCK_EVENT, phase });

        setGreeting("");

        setEventGuid(eventGuidParam ?? null);

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



  const phase = phaseOverride ?? event.phase;



  return {

    runner,

    event: { ...event, phase },

    phase,

    greeting,

    eventGuid,

    aiEnabled,

    visitor,

    loading,

    error,

    apiConnected,

  };

}

