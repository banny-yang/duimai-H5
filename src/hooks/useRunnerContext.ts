import { useCallback, useEffect, useMemo, useState } from "react";

import {
  bindRunnerIdentity,
  enterSession,
  fetchNotice,
  fetchH5QuickQuestions,
  fetchPublicEvent,
  forgetRunnerIdentity,
  applyNoticeToEvent,
  mapPublicToEvent,
  mapSessionToRunner,
  setStoredEventGuid,
} from "@/api/runner-api";
import type { H5QuickQuestions, SessionEnterVO } from "@/api/runner-api";
import { ApiError } from "@/lib/api-client";
import { readPhaseOverride, resolveH5Phase } from "@/lib/event-phase";
import { getStoredIdentity } from "@/lib/runner-identity";
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
  emergencyNotice: null,
  emergencyActive: false,
};

const NOTICE_POLL_MS = 15000;

export interface RunnerContextState {
  runner: RunnerProfile;
  event: EventInfo;
  phase: H5Phase;
  greeting: string;
  eventGuid: string | null;
  eventStatus: string | null;
  h5QuickQuestions: H5QuickQuestions | null;
  aiEnabled: boolean;
  /** 是否已完成参赛号+身份证验证（含本地缓存自动恢复） */
  identityVerified: boolean;
  loading: boolean;
  error: string | null;
  apiConnected: boolean;
  verifyIdentity: (bibNumber: string, idCardSuffix: string) => Promise<void>;
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
  const [identityVerified, setIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  const applySession = useCallback((session: SessionEnterVO) => {
    setRunner(mapSessionToRunner(session));
    setGreeting(session.greeting ?? "");
    setIdentityVerified(session.visitor !== true);
  }, []);

  const tryRestoreIdentity = useCallback(
    async (guid: string, session: SessionEnterVO): Promise<SessionEnterVO> => {
      if (session.visitor !== true) return session;
      const stored = getStoredIdentity(guid);
      if (!stored) return session;
      try {
        return await bindRunnerIdentity(
          stored.eventGuid,
          stored.bibNumber,
          stored.idCardSuffix,
        );
      } catch {
        forgetRunnerIdentity(guid);
        return session;
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setApiConnected(false);

      try {
        setStoredEventGuid(eventGuidParam);

        const [pub, quickQuestions] = await Promise.all([
          fetchPublicEvent(eventGuidParam),
          fetchH5QuickQuestions(eventGuidParam),
        ]);

        let session = await enterSession(eventGuidParam);
        session = await tryRestoreIdentity(eventGuidParam, session);

        const notice = await fetchNotice(eventGuidParam).catch(() => undefined);

        if (cancelled) return;

        const baseEvent = mapPublicToEvent(pub, notice);
        const phase = resolveH5Phase({
          eventDate: pub.eventDate,
          eventStatus: pub.status,
          apiPhase: pub.phase,
          phaseOverride,
        });

        applySession(session);
        setEvent({ ...baseEvent, phase });
        setEventGuid(pub.eventGuid);
        setEventStatus(pub.status ?? null);
        setH5QuickQuestions(quickQuestions);
        setAiEnabled(pub.aiEnabled);
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
        setIdentityVerified(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventGuidParam, phaseOverride, applySession, tryRestoreIdentity]);

  /** 轮询应急广播 / 赛段通知（发布后无需刷新页面） */
  useEffect(() => {
    if (!eventGuidParam || !apiConnected) return;

    const refresh = async () => {
      try {
        const notice = await fetchNotice(eventGuidParam);
        setEvent((prev) => {
          const next = applyNoticeToEvent(prev, notice);
          const phase = resolveH5Phase({
            eventDate: prev.eventDate,
            eventStatus: eventStatus,
            apiPhase: prev.phase,
            phaseOverride,
          });
          return { ...next, phase };
        });
      } catch {
        /* 静默失败，下次轮询重试 */
      }
    };

    const timer = setInterval(refresh, NOTICE_POLL_MS);
    return () => clearInterval(timer);
  }, [eventGuidParam, apiConnected, eventStatus, phaseOverride]);

  const verifyIdentity = useCallback(
    async (bibNumber: string, idCardSuffix: string) => {
      const session = await bindRunnerIdentity(
        eventGuidParam,
        bibNumber,
        idCardSuffix,
      );
      applySession(session);
    },
    [eventGuidParam, applySession],
  );

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
    identityVerified,
    loading,
    error,
    apiConnected,
    verifyIdentity,
  };
}
