import { apiGet, apiPost, setRunnerToken } from "@/lib/api-client";
import type { EventInfo, RacePhase, RunnerProfile } from "@/types";

const EVENT_GUID_KEY = "duimai_event_guid";

export function getStoredEventGuid(): string | null {
  return sessionStorage.getItem(EVENT_GUID_KEY);
}

export function setStoredEventGuid(guid: string | null) {
  if (guid) sessionStorage.setItem(EVENT_GUID_KEY, guid);
  else sessionStorage.removeItem(EVENT_GUID_KEY);
}

const EVENT_GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 从路径 /{event_guid} 解析赛事 GUID */
export function readEventGuidFromPath(): string | undefined {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && EVENT_GUID_RE.test(last)) {
    return last;
  }
  return undefined;
}

/** 路径优先；兼容旧版 ?event_guid= */
export function readEventGuidFromUrl(): string | undefined {
  const fromPath = readEventGuidFromPath();
  if (fromPath) return fromPath;
  const q = new URLSearchParams(window.location.search);
  return q.get("event_guid")?.trim() || q.get("event")?.trim() || undefined;
}

/** 将 ?event_guid= 旧链接重定向为 /{guid} */
export function redirectLegacyEventGuidUrl(): void {
  const q = new URLSearchParams(window.location.search);
  const legacy = q.get("event_guid")?.trim() || q.get("event")?.trim();
  if (!legacy || !EVENT_GUID_RE.test(legacy)) return;
  if (readEventGuidFromPath()) return;
  q.delete("event_guid");
  q.delete("event");
  const qs = q.toString();
  window.history.replaceState(null, "", `/${legacy}${qs ? `?${qs}` : ""}`);
}

export interface SessionEnterVO {
  visitor?: boolean;
  runnerId?: string | null;
  eventGuid?: string;
  token: string;
  name: string;
  bibNumber: string;
  zone: string;
  eventName: string;
  phase: string;
  greeting: string;
  checkInBefore: string;
}

export interface PublicEventVO {
  eventGuid: string;
  eventId: string;
  eventName: string;
  phase: string;
  status: string;
  aiEnabled: boolean;
  agent: {
    assistantName: string;
    personality?: string;
    greetingTemplate?: string;
  };
}

export interface NoticeVO {
  phase: string;
  text: string;
  actionHint: string;
}

export interface ProfileVO {
  name: string;
  bibNumber: string;
  zone: string;
  bloodType?: string;
  category?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  pickupHint?: string;
  pickupWindow?: string;
  checkInBefore?: string;
}

export interface ChatRequest {
  query: string;
  conversationId?: string;
}

export interface ChatResponseVO {
  answer: string;
  conversationId?: string;
}

export interface SosSubmitRequest {
  lat?: number;
  lng?: number;
  battery?: number;
  signal?: string;
  symptom: string;
  symptomKey?: string;
}

export interface SosSubmitResult {
  accepted: boolean;
  message: string;
}

export function mapSessionToRunner(s: SessionEnterVO): RunnerProfile {
  const bib = s.bibNumber ?? "";
  const guest = s.visitor === true;
  return {
    id: s.runnerId ?? (guest ? "visitor" : ""),
    name: s.name,
    bib: bib || (guest ? "—" : ""),
    zone: s.zone || (guest ? "—" : "A区"),
    bloodType: "—",
    pickupWindow: "赛事服务中心",
    pickupCounter: "—",
    emergencyContact: "—",
    emergencyPhone: "—",
    checkInBefore: s.checkInBefore ?? "07:15",
    greeting: s.greeting,
  };
}

export function mapPublicToEvent(pub: PublicEventVO, notice?: NoticeVO): EventInfo {
  const phase = (pub.phase === "race" ? "race" : "pre") as RacePhase;
  const fallbackPre = `距离${pub.eventName}开跑在即，请尽快领取参赛包。`;
  const fallbackRace = "赛中播报：请注意补给与路况，如需帮助请长按 SOS。";
  const noticeText = notice?.text;
  return {
    name: pub.eventName,
    phase,
    preNotice: phase === "pre" ? noticeText ?? fallbackPre : fallbackPre,
    raceNotice: phase === "race" ? noticeText ?? fallbackRace : fallbackRace,
    actionHint: notice?.actionHint,
  };
}

export function mergeProfile(base: RunnerProfile, p: ProfileVO): RunnerProfile {
  return {
    ...base,
    name: p.name ?? base.name,
    bib: p.bibNumber ?? base.bib,
    zone: p.zone ?? base.zone,
    bloodType: p.bloodType ? `${p.bloodType}`.replace(/型型$/, "型") : base.bloodType,
    pickupWindow: p.pickupWindow ?? p.pickupHint ?? base.pickupWindow,
    pickupCounter: p.pickupWindow ?? base.pickupCounter,
    emergencyContact: p.emergencyContact ?? base.emergencyContact,
    emergencyPhone: p.emergencyPhone ?? base.emergencyPhone,
    checkInBefore: p.checkInBefore ?? base.checkInBefore,
  };
}

export async function fetchPublicEvent(eventGuid: string) {
  return apiGet<PublicEventVO>("/runner/event/public", { eventGuid }, false);
}

export async function enterSession(eventGuid: string) {
  const data = await apiGet<SessionEnterVO>(
    "/runner/session/enter",
    { eventGuid },
    false,
  );
  setRunnerToken(data.token);
  if (data.eventGuid) setStoredEventGuid(data.eventGuid);
  return data;
}

export async function fetchNotice(eventGuid?: string) {
  const guid = eventGuid ?? getStoredEventGuid() ?? undefined;
  return apiGet<NoticeVO>("/runner/session/notice", { eventGuid: guid }, false);
}

export async function fetchProfile() {
  return apiGet<ProfileVO>("/runner/profile/me");
}

export async function sendChat(req: ChatRequest) {
  return apiPost<ChatResponseVO>("/runner/chat", req);
}

const SYMPTOM_LABEL: Record<string, string> = {
  heart: "心脏不适 / 胸闷",
  muscle: "肌肉拉伤 / 抽筋",
  injury: "外伤出血 / 跌倒",
};

export async function submitSos(body: SosSubmitRequest) {
  const symptom =
    body.symptom ||
    (body.symptomKey ? SYMPTOM_LABEL[body.symptomKey] ?? body.symptomKey : "心脏不适 / 胸闷");
  return apiPost<SosSubmitResult>("/runner/sos", {
    lat: body.lat,
    lng: body.lng,
    battery: body.battery,
    signal: body.signal,
    symptom,
  });
}
