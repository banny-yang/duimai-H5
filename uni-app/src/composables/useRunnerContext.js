import { ref, computed, onUnmounted, unref } from 'vue'
import {
  bindRunnerIdentity,
  enterSession,
  fetchNotice,
  fetchH5QuickQuestions,
  fetchOfflinePack,
  fetchEventShuttleConfig,
  fetchPublicEvent,
  forgetRunnerIdentity,
  applyNoticeToEvent,
  mapPublicToEvent,
  mapSessionToRunner,
  setStoredEventGuid,
} from '@/utils/runner-api.js'
import { readOfflinePack, writeOfflinePack } from '@/utils/h5-offline-cache.js'
import { getStoredIdentity } from '@/utils/runner-identity.js'
import { resolveH5Phase } from '@/utils/event-phase.js'
import { resolveLocale } from '@/utils/i18n.js'
import { ApiError } from '@/utils/api.js'

const EMPTY_RUNNER = {
  id: '',
  name: '',
  bib: '',
  zone: '',
  bloodType: '',
  pickupWindow: '',
  pickupCounter: '',
  emergencyContact: '',
  emergencyPhone: '',
  checkInBefore: '',
}

const EMPTY_EVENT = {
  name: '',
  phase: 'pre',
  preNotice: '',
  raceNotice: '',
  postNotice: '',
  emergencyNotice: null,
  emergencyActive: false,
}

const NOTICE_POLL_MS = 15000

export function useRunnerContext(eventGuidSource, options = {}) {
  const getGuid = () => unref(eventGuidSource)
  const phaseOverride = computed(() => unref(options.phaseOverride))
  const langQuery = computed(() => unref(options.langQuery))

  const runner = ref({ ...EMPTY_RUNNER })
  const event = ref({ ...EMPTY_EVENT })
  const greeting = ref('')
  const eventGuid = ref(getGuid() ?? null)
  const eventStatus = ref(null)
  const h5QuickQuestions = ref(null)
  const branding = ref(null)
  const shuttleConfig = ref(null)
  const locale = ref('zh')
  const offlineMode = ref(false)
  const aiEnabled = ref(false)
  const identityVerified = ref(false)
  const loading = ref(true)
  const error = ref(null)
  const apiConnected = ref(false)

  let noticeTimer = null

  function applySession(session) {
    runner.value = mapSessionToRunner(session)
    greeting.value = session.greeting ?? ''
    identityVerified.value = session.visitor !== true
  }

  async function tryRestoreIdentity(guid, session) {
    if (session.visitor !== true) return session
    const stored = getStoredIdentity(guid)
    if (!stored) return session
    try {
      return await bindRunnerIdentity(
        stored.eventGuid,
        stored.bibNumber,
        stored.idCardSuffix,
      )
    } catch {
      forgetRunnerIdentity(guid)
      return session
    }
  }

  async function load() {
    const guid = getGuid()
    if (!guid) return

    loading.value = true
    error.value = null
    apiConnected.value = false
    offlineMode.value = false

    try {
      setStoredEventGuid(guid)
      let pub
      let quickQuestions = null
      let fromOfflineCache = false

      try {
        const [p, q, shuttle] = await Promise.all([
          fetchPublicEvent(guid),
          fetchH5QuickQuestions(guid),
          fetchEventShuttleConfig(guid).catch(() => null),
        ])
        pub = p
        quickQuestions = q
        shuttleConfig.value = shuttle
        fetchOfflinePack(guid)
          .then((pack) => {
            writeOfflinePack(guid, {
              eventGuid: pack.eventGuid,
              eventName: pack.eventName,
              phase: pack.phase,
              cachedAt: pack.cachedAt,
              quickQuestions: pack.quickQuestions ?? q,
              faqSnippets: pack.faqSnippets ?? [],
              branding: pack.branding ?? p.branding ?? null,
              shuttle: shuttleConfig.value,
            })
          })
          .catch(() => {})
      } catch (loadErr) {
        const cached = readOfflinePack(guid)
        if (!cached) throw loadErr
        pub = {
          eventGuid: guid,
          eventId: '',
          eventName: cached.eventName,
          phase: cached.phase,
          status: 'published',
          aiEnabled: false,
          agent: { assistantName: '助手' },
          h5QuickQuestions: cached.quickQuestions,
          branding: cached.branding ?? null,
        }
        quickQuestions = cached.quickQuestions
        shuttleConfig.value = cached.shuttle ?? null
        fromOfflineCache = true
      }

      let session = null
      if (!fromOfflineCache) {
        session = await enterSession(guid)
        session = await tryRestoreIdentity(guid, session)
      }

      const notice = fromOfflineCache
        ? undefined
        : await fetchNotice(guid).catch(() => undefined)

      const baseEvent = mapPublicToEvent(pub, notice)
      const phase = resolveH5Phase({
        eventDate: pub.eventDate,
        eventStatus: pub.status,
        apiPhase: pub.phase,
        phaseOverride: phaseOverride.value,
      })

      if (session) applySession(session)
      event.value = { ...baseEvent, phase }
      eventGuid.value = pub.eventGuid
      eventStatus.value = pub.status ?? null
      h5QuickQuestions.value = quickQuestions
      branding.value = pub.branding ?? null
      locale.value = resolveLocale(langQuery.value, pub.branding?.h5Locale)
      aiEnabled.value = pub.aiEnabled
      apiConnected.value = true
      offlineMode.value = fromOfflineCache
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '无法连接选手端服务'
      error.value = msg
      apiConnected.value = false
      runner.value = { ...EMPTY_RUNNER }
      event.value = { ...EMPTY_EVENT }
      greeting.value = ''
      eventGuid.value = guid ?? null
      eventStatus.value = null
      h5QuickQuestions.value = null
      branding.value = null
      shuttleConfig.value = null
      offlineMode.value = false
      aiEnabled.value = false
      identityVerified.value = false
    } finally {
      loading.value = false
    }
  }

  function startNoticePoll() {
    if (noticeTimer) clearInterval(noticeTimer)
    noticeTimer = setInterval(async () => {
      if (!apiConnected.value) return
      const guid = getGuid()
      if (!guid) return
      try {
        const notice = await fetchNotice(guid)
        event.value = applyNoticeToEvent(event.value, notice)
        const phase = resolveH5Phase({
          eventDate: event.value.eventDate,
          eventStatus: eventStatus.value,
          apiPhase: event.value.phase,
          phaseOverride: phaseOverride.value,
        })
        event.value = { ...event.value, phase }
      } catch {
        /* 静默 */
      }
    }, NOTICE_POLL_MS)
  }

  async function verifyIdentity(bibNumber, idCardSuffix) {
    const session = await bindRunnerIdentity(getGuid(), bibNumber, idCardSuffix)
    applySession(session)
  }

  const phase = computed(() =>
    resolveH5Phase({
      eventDate: event.value.eventDate,
      eventStatus: eventStatus.value,
      apiPhase: event.value.phase,
      phaseOverride: phaseOverride.value,
    }),
  )

  onUnmounted(() => {
    if (noticeTimer) clearInterval(noticeTimer)
  })

  return {
    runner,
    event,
    phase,
    greeting,
    eventGuid,
    eventStatus,
    h5QuickQuestions,
    branding,
    shuttleConfig,
    locale,
    offlineMode,
    aiEnabled,
    identityVerified,
    loading,
    error,
    apiConnected,
    load,
    startNoticePoll,
    verifyIdentity,
  }
}
