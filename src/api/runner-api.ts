import { apiGet, apiPost, setRunnerToken } from "@/lib/api-client";
import {
  clearStoredIdentity,
  saveStoredIdentity,
  type StoredRunnerIdentity,
} from "@/lib/runner-identity";
import { resolveH5Phase } from "@/lib/event-phase";
import type { EventInfo, H5Phase, RunnerProfile } from "@/types";

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

export interface H5QuickQuestions {
  pre?: string[];
  race?: string[];
  post?: string[];
}

export interface PublicEventVO {
  eventGuid: string;
  eventId: string;
  eventName: string;
  phase: string;
  /** yyyy-MM-dd */
  eventDate?: string | null;
  status: string;
  aiEnabled: boolean;
  agent: {
    assistantName: string;
    personality?: string;
    greetingTemplate?: string;
  };
  h5QuickQuestions?: H5QuickQuestions | null;
}

export interface NoticeVO {
  phase: string;
  text: string;
  actionHint: string;
  emergency?: boolean;
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

export interface ChatInboxMessageVO {
  id: string;
  role: string;
  text: string;
  createdAt?: number;
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
  const phase = resolveH5Phase({
    eventDate: pub.eventDate,
    eventStatus: pub.status,
    apiPhase: pub.phase,
  }) as H5Phase;
  const fallbackPre = `距离${pub.eventName}开跑在即，请尽快领取参赛包。`;
  const fallbackRace = "赛中播报：请注意补给与路况，如需帮助请长按 SOS。";
  const fallbackPost = "赛事已结束，可查询成绩、接驳与赛后服务。";
  const noticePhase = notice?.phase;
  const noticeText = notice?.text;
  const isEmergency = notice?.emergency === true && !!noticeText?.trim();

  if (isEmergency) {
    const text = noticeText!.trim();
    return {
      name: pub.eventName,
      phase,
      eventDate: pub.eventDate ?? null,
      emergencyNotice: text,
      emergencyActive: true,
      preNotice: text,
      raceNotice: text,
      postNotice: text,
      actionHint: notice?.actionHint ?? "点击查看应急通知 ›",
    };
  }

  return {
    name: pub.eventName,
    phase,
    eventDate: pub.eventDate ?? null,
    emergencyNotice: null,
    emergencyActive: false,
    preNotice:
      noticePhase === "pre" && noticeText ? noticeText : fallbackPre,
    raceNotice:
      noticePhase === "race" && noticeText ? noticeText : fallbackRace,
    postNotice:
      noticePhase === "post" && noticeText ? noticeText : fallbackPost,
    actionHint: notice?.actionHint,
  };
}

/** 将最新通知合并进已有 EventInfo（保留 phase 等字段） */
export function applyNoticeToEvent(event: EventInfo, notice?: NoticeVO): EventInfo {
  const merged = mapPublicToEvent(
    {
      eventGuid: "",
      eventId: "",
      eventName: event.name,
      phase: event.phase,
      eventDate: event.eventDate,
      status: "",
      aiEnabled: true,
      agent: { assistantName: "" },
    },
    notice,
  );
  return { ...event, ...merged, phase: event.phase };
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

export interface RunnerEventListItem {
  eventGuid: string;
  eventName: string;
  phase: string;
  status: string;
  location?: string | null;
  eventDate?: string | null;
  type?: string | null;
}

/** 进入指定赛事页（保留当前 query，如 ?phase=race） */
export function navigateToEvent(eventGuid: string) {
  const qs = window.location.search;
  const path = `/${eventGuid}${qs}`;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** 平台审核通过后可对 H5 展示的赛事状态 */
export const H5_APPROVED_EVENT_STATUSES = ["published", "finished"] as const;

export function isH5ApprovedEvent(status?: string | null): boolean {
  return (
    status != null &&
    (H5_APPROVED_EVENT_STATUSES as readonly string[]).includes(status)
  );
}

export async function fetchSelectableEvents() {
  const list = await apiGet<RunnerEventListItem[]>(
    "/runner/event/list",
    undefined,
    false,
  );
  return list.filter((e) => isH5ApprovedEvent(e.status));
}

export async function fetchPublicEvent(eventGuid: string) {
  return apiGet<PublicEventVO>("/runner/event/public", { eventGuid }, false);
}

/** 选手端 H5 常用问题（赛前/赛中/赛后），来自 duimai-frontend-service */
export async function fetchH5QuickQuestions(eventGuid: string) {
  return apiGet<H5QuickQuestions>(
    "/runner/event/quick-questions",
    { eventGuid },
    false,
  );
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

/** 参赛号 + 身份证后6位验证，签发选手 JWT 并写入本地身份缓存 */
export async function bindRunnerIdentity(
  eventGuid: string,
  bibNumber: string,
  idCardSuffix: string,
): Promise<SessionEnterVO> {
  const data = await apiPost<SessionEnterVO>(
    "/runner/session/bind",
    { eventGuid, bibNumber: bibNumber.trim(), idCardSuffix: idCardSuffix.trim() },
    false,
  );
  setRunnerToken(data.token);
  if (data.eventGuid) setStoredEventGuid(data.eventGuid);
  const stored: StoredRunnerIdentity = {
    eventGuid: data.eventGuid ?? eventGuid,
    bibNumber: bibNumber.trim(),
    idCardSuffix: idCardSuffix.trim(),
    savedAt: new Date().toISOString(),
  };
  saveStoredIdentity(stored);
  return data;
}

export function forgetRunnerIdentity(eventGuid: string) {
  clearStoredIdentity(eventGuid);
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

/** 拉取危机中心人工回复（服务端 drain，每条仅送达一次） */
export async function fetchChatInbox() {
  return apiGet<ChatInboxMessageVO[]>("/runner/chat/inbox");
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
