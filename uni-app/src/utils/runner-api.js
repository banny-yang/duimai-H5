import {
  apiGet,
  apiPost,
  apiUpload,
  apiUploadBlob,
  setRunnerToken,
  getRunnerToken,
  ApiError,
  CHAT_TIMEOUT_MS,
} from './api.js'
import { clearStoredIdentity, saveStoredIdentity } from './runner-identity.js'
import { resolveH5Phase } from './event-phase.js'
import { migrateToBundle } from './route-map.js'
import { normalizeShuttleConfig } from './shuttle.js'
import { getWxLoginCode, getStoredWxProfile } from './mp-login.js'

const EVENT_GUID_KEY = 'duimai_event_guid'

const EVENT_GUID_DASHED_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EVENT_GUID_SIMPLE_RE = /^[0-9a-f]{32}$/i

export const H5_APPROVED_EVENT_STATUSES = ['published', 'finished']

export function getStoredEventGuid() {
  return uni.getStorageSync(EVENT_GUID_KEY) || null
}

export function setStoredEventGuid(guid) {
  if (guid) uni.setStorageSync(EVENT_GUID_KEY, guid)
  else uni.removeStorageSync(EVENT_GUID_KEY)
}

/** 从小程序 onLoad query 解析赛事 GUID（支持 eventGuid 与扫码 scene） */
export function resolveEventGuidFromLaunchQuery(query) {
  const direct = String(query?.eventGuid || '').trim()
  if (direct) return direct
  const sceneRaw = query?.scene
  if (sceneRaw == null || sceneRaw === '') return ''
  try {
    return decodeURIComponent(String(sceneRaw)).trim()
  } catch {
    return String(sceneRaw).trim()
  }
}

export function isEventPublicGuid(value) {
  const v = value.trim()
  return EVENT_GUID_DASHED_RE.test(v) || EVENT_GUID_SIMPLE_RE.test(v)
}

/** 从扫码结果、链接或纯 GUID 文本解析赛事 public_guid */
export function parseEventGuidFromText(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  if (isEventPublicGuid(text)) return text
  try {
    const url = new URL(text)
    const segments = url.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (last && isEventPublicGuid(last)) return last
    const q =
      url.searchParams.get('eventGuid') ||
      url.searchParams.get('event_guid') ||
      url.searchParams.get('event')
    if (q && isEventPublicGuid(q)) return q
  } catch {
    /* not a URL */
  }
  const m = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}/i,
  )
  if (m && isEventPublicGuid(m[0])) return m[0]
  return null
}

export function isH5ApprovedEvent(status) {
  return status != null && H5_APPROVED_EVENT_STATUSES.includes(status)
}

export function navigateToRunner(eventGuid) {
  uni.navigateTo({
    url: `/pages/runner/runner?eventGuid=${encodeURIComponent(eventGuid)}`,
  })
}

export function mapSessionToRunner(s) {
  const bib = s.bibNumber ?? ''
  const guest = s.visitor === true
  return {
    id: s.runnerId ?? (guest ? 'visitor' : ''),
    name: s.name,
    bib: bib || (guest ? '—' : ''),
    zone: s.zone || (guest ? '—' : 'A区'),
    bloodType: '—',
    pickupWindow: '赛事服务中心',
    pickupCounter: '—',
    emergencyContact: '—',
    emergencyPhone: '—',
    checkInBefore: s.checkInBefore ?? '07:15',
    greeting: s.greeting,
    category: s.category,
  }
}

export function mapPublicToEvent(pub, notice) {
  const phase = resolveH5Phase({
    eventDate: pub.eventDate,
    eventStatus: pub.status,
    apiPhase: pub.phase,
  })
  const fallbackPre = `距离${pub.eventName}开跑在即，请尽快领取参赛包。`
  const fallbackRace = '赛中播报：请注意补给与路况，如需帮助请长按 SOS。'
  const fallbackPost = '赛事已结束，可查看接驳与赛后服务。'
  const noticePhase = notice?.phase
  const noticeText = notice?.text
  const isEmergency = notice?.emergency === true && !!noticeText?.trim()

  if (isEmergency) {
    const text = noticeText.trim()
    return {
      name: pub.eventName,
      phase,
      eventDate: pub.eventDate ?? null,
      emergencyNotice: text,
      emergencyActive: true,
      preNotice: text,
      raceNotice: text,
      postNotice: text,
      actionHint: notice?.actionHint ?? '点击查看应急通知',
    }
  }

  return {
    name: pub.eventName,
    phase,
    eventDate: pub.eventDate ?? null,
    emergencyNotice: null,
    emergencyActive: false,
    preNotice: noticePhase === 'pre' && noticeText ? noticeText : fallbackPre,
    raceNotice: noticePhase === 'race' && noticeText ? noticeText : fallbackRace,
    postNotice: noticePhase === 'post' && noticeText ? noticeText : fallbackPost,
    actionHint: notice?.actionHint,
  }
}

export function applyNoticeToEvent(event, notice) {
  const merged = mapPublicToEvent(
    {
      eventGuid: '',
      eventId: '',
      eventName: event.name,
      phase: event.phase,
      eventDate: event.eventDate,
      status: '',
      aiEnabled: true,
      agent: { assistantName: '' },
    },
    notice,
  )
  return { ...event, ...merged, phase: event.phase }
}

export function mergeProfile(base, p) {
  return {
    ...base,
    name: p.name ?? base.name,
    bib: p.bibNumber ?? base.bib,
    category: p.category ?? base.category,
    zone: p.zone ?? base.zone,
    bloodType: p.bloodType ? `${p.bloodType}`.replace(/型型$/, '型') : base.bloodType,
    pickupWindow: p.pickupWindow ?? p.pickupHint ?? base.pickupWindow,
    pickupCounter: p.pickupWindow ?? base.pickupCounter,
    emergencyContact: p.emergencyContact ?? base.emergencyContact,
    emergencyPhone: p.emergencyPhone ?? base.emergencyPhone,
    checkInBefore: p.checkInBefore ?? base.checkInBefore,
  }
}

function normalizeBranding(raw) {
  if (!raw) return null
  return {
    logoUrl: raw.logoUrl?.trim() ?? '',
    brandTitle: raw.brandTitle?.trim() ?? '',
    themeColor: raw.themeColor?.trim() || 'blue',
    footerText: raw.footerText?.trim() ?? '',
    h5Locale: raw.h5Locale?.trim() || 'zh',
    hidePoweredBy: Boolean(raw.hidePoweredBy),
  }
}

export async function fetchSelectableEvents() {
  const list = await apiGet('/runner/event/list', undefined, false)
  return list.filter((e) => isH5ApprovedEvent(e.status))
}

export async function fetchPublicEvent(eventGuid) {
  const data = await apiGet('/runner/event/public', { eventGuid }, false)
  return { ...data, branding: normalizeBranding(data.branding) }
}

export async function fetchH5QuickQuestions(eventGuid) {
  return apiGet('/runner/event/quick-questions', { eventGuid }, false)
}

export async function enterSession(eventGuid) {
  const data = await apiGet('/runner/session/enter', { eventGuid }, false)
  setRunnerToken(data.token)
  if (data.eventGuid) setStoredEventGuid(data.eventGuid)
  return data
}

/** 微信小程序：wx.login + 用户授权昵称头像 */
export async function wxLoginSession(eventGuid, options = {}) {
  const loginCode = options.loginCode || (await getWxLoginCode())
  const payload = { eventGuid, loginCode }
  const nickName = String(options.nickName || '').trim()
  const avatarUrl = String(options.avatarUrl || '').trim()
  if (nickName) payload.nickName = nickName
  if (avatarUrl) payload.avatarUrl = avatarUrl
  const data = await apiPost('/runner/session/wx-login', payload, false)
  setRunnerToken(data.token)
  if (data.eventGuid) setStoredEventGuid(data.eventGuid)
  return data
}

/** 小程序进入赛事：wx-login（带本地已存头像昵称），失败回退 enter */
export async function enterSessionForPlatform(eventGuid) {
  // #ifdef MP-WEIXIN
  try {
    const stored = getStoredWxProfile()
    return await wxLoginSession(eventGuid, stored || {})
  } catch {
    return await enterSession(eventGuid)
  }
  // #endif
  // #ifndef MP-WEIXIN
  return enterSession(eventGuid)
  // #endif
}

export async function bindRunnerIdentity(eventGuid, bibNumber, idCardSuffix) {
  const data = await apiPost(
    '/runner/session/bind',
    {
      eventGuid,
      bibNumber: bibNumber.trim(),
      idCardSuffix: idCardSuffix.trim(),
    },
    false,
  )
  setRunnerToken(data.token)
  if (data.eventGuid) setStoredEventGuid(data.eventGuid)
  saveStoredIdentity({
    eventGuid: data.eventGuid ?? eventGuid,
    bibNumber: bibNumber.trim(),
    idCardSuffix: idCardSuffix.trim(),
    savedAt: new Date().toISOString(),
  })
  return data
}

export function forgetRunnerIdentity(eventGuid) {
  clearStoredIdentity(eventGuid)
}

export async function fetchNotice(eventGuid) {
  const guid = eventGuid ?? getStoredEventGuid() ?? undefined
  return apiGet('/runner/session/notice', { eventGuid: guid }, false)
}

export async function fetchProfile() {
  return apiGet('/runner/profile/me')
}

export async function sendChat(req) {
  if (!getRunnerToken()) {
    throw new ApiError('会话未建立，请返回首页重新进入赛事', 401)
  }
  return apiPost('/runner/chat', req, true, { timeout: CHAT_TIMEOUT_MS })
}

export async function transcribeSpeech(filePathOrBlob) {
  if (typeof Blob !== 'undefined' && filePathOrBlob instanceof Blob) {
    const ext =
      filePathOrBlob.type?.includes('mp4') || filePathOrBlob.type?.includes('aac')
        ? 'm4a'
        : 'webm'
    return apiUploadBlob('/runner/chat/speech-to-text', filePathOrBlob, 'audio', `recording.${ext}`)
  }
  return apiUpload('/runner/chat/speech-to-text', filePathOrBlob, 'audio')
}

export async function fetchChatInbox() {
  return apiGet('/runner/chat/inbox')
}

export async function fetchChatHistory(limit = 50) {
  return apiGet('/runner/chat/history', { limit: String(limit) })
}

const SYMPTOM_LABEL = {
  heart: '心脏不适 / 胸闷',
  muscle: '肌肉拉伤 / 抽筋',
  injury: '外伤出血 / 跌倒',
}

export async function fetchSosRescueConfig(eventGuid) {
  return apiGet('/runner/sos/rescue-config', { eventGuid }, false)
}

export async function submitSos(body) {
  const symptom =
    body.symptom ||
    (body.symptomKey ? SYMPTOM_LABEL[body.symptomKey] ?? body.symptomKey : '心脏不适 / 胸闷')
  return apiPost('/runner/sos', {
    lat: body.lat,
    lng: body.lng,
    battery: body.battery,
    signal: body.signal,
    symptom,
  })
}

export async function fetchOfflinePack(eventGuid) {
  return apiGet('/runner/event/offline-pack', { eventGuid }, false)
}

export async function fetchAmapClientConfig() {
  return apiGet('/runner/map/amap-client', undefined, false)
}

export async function fetchEventShuttleConfig(eventGuid) {
  const raw = await apiGet('/runner/shuttle', { eventGuid }, false)
  return normalizeShuttleConfig(raw)
}

export async function fetchEventRouteMapBundle(eventGuid) {
  const raw = await apiGet('/runner/map/routes', { eventGuid }, false)
  return migrateToBundle(raw)
}

export async function fetchMapPoiHeat(eventGuid, routeId) {
  const params = { eventGuid }
  if (routeId) params.routeId = routeId
  return apiGet('/runner/map/poi-heat', params, false)
}

export async function submitSosBeacon(body) {
  return apiPost('/runner/sos/beacon', body)
}

export async function fetchSpeechToTextStatus() {
  return apiGet('/runner/chat/speech-to-text/status')
}

export async function fetchLegalDoc(type) {
  const path = type === 'privacy' ? '/public/legal/privacy' : '/public/legal/terms'
  return apiGet(path, undefined, false)
}
