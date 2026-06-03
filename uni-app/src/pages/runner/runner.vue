<template>
  <view class="h5-root h5-root--runner" :style="mpRootStyle">
    <view v-if="loading" class="loading-screen">
      <text>{{ t(locale, 'loadingEvent') }}</text>
    </view>

    <ConnectionError
      v-else-if="!apiConnected || error"
      :message="error || t(locale, 'connectionError')"
      :event-guid="eventGuidParam"
      @retry="reload"
    />

    <view v-else class="runner-shell" :class="{ 'runner-shell--chat-maximized': isMp && chatMaximized }" :style="themeStyle">
      <view class="runner-header">
        <view class="header-left">
          <image v-if="headerLogo" class="logo-img" :src="headerLogo" mode="aspectFit" />
          <view v-else class="logo-mark">麦</view>
          <view class="header-text">
            <text class="header-sub">{{ locale === 'en' ? 'Duimai Runner' : '对麦智能 · 选手助手' }}</text>
            <text class="header-title">{{ displayTitle }}</text>
          </view>
        </view>
        <view class="header-right">
          <text v-if="!identityVerified" class="verify-pill" @tap="verifyOpen = true">
            {{ t(locale, 'verifyIdentity') }}
          </text>
          <PhaseBadge :phase="phase" />
        </view>
      </view>

      <!-- 小程序：信息(flex:1) | 聊天(贴协议栏) | 协议栏 — 文档流，无 absolute -->
      <template v-if="isMp">
        <view class="runner-body">
          <view class="runner-info-scroll">
            <RunnerTopSection
              :event="eventWithPhase"
              :identity-verified="identityVerified"
              @verify="verifyOpen = true"
              @shortcut="onShortcut"
            />
          </view>
        </view>
        <view
          class="runner-chat-dock"
          :class="{ 'runner-chat-dock--maximized': chatMaximized }"
        >
          <ChatPanel
            ref="chatPanelRef"
            :phase="phase"
            :runner="runner"
            :greeting="greeting"
            :chat-enabled="chatEnabled"
            :chat-disabled-hint="chatDisabledHint"
            :offline-hint="offlineMode ? t(locale, 'offlineHint') : undefined"
            :h5-quick-questions="h5QuickQuestions"
            :inbox-poll-enabled="apiConnected && identityVerified"
            :history-enabled="apiConnected && identityVerified"
            :runner-id="runner.id"
            :maximized="chatMaximized"
            :messages-scroll-px="messagesScrollPx"
            :locale="locale"
            @toggle-maximize="chatMaximized = !chatMaximized"
          />
        </view>
      </template>

      <view
        v-else
        class="runner-main"
        :class="{ 'runner-main--chat-maximized': chatMaximized }"
      >
        <RunnerTopSection
          :event="eventWithPhase"
          :identity-verified="identityVerified"
          @verify="verifyOpen = true"
          @shortcut="onShortcut"
        />
        <view class="runner-chat-slot">
          <ChatPanel
            ref="chatPanelRef"
            :phase="phase"
            :runner="runner"
            :greeting="greeting"
            :chat-enabled="chatEnabled"
            :chat-disabled-hint="chatDisabledHint"
            :offline-hint="offlineMode ? t(locale, 'offlineHint') : undefined"
            :h5-quick-questions="h5QuickQuestions"
            :inbox-poll-enabled="apiConnected && identityVerified"
            :history-enabled="apiConnected && identityVerified"
            :runner-id="runner.id"
            :maximized="chatMaximized"
            :locale="locale"
            @toggle-maximize="chatMaximized = !chatMaximized"
          />
        </view>
      </view>

      <SosFloatingButton
        :disabled="!identityVerified"
        @triggered="sosOpen = true"
        @disabled-tap="verifyOpen = true"
      />

      <ChatFooter
        :footer-support="footerSupport"
        :hide-powered-by="Boolean(branding?.hidePoweredBy)"
        :locale="locale"
        @open-legal="legal = $event"
      />
    </view>

    <view v-if="sosToast" class="sos-toast">{{ sosToast }}</view>

    <IdentityVerifyPopup
      :show="verifyOpen"
      :event-guid="eventGuidParam"
      :event-name="event.name"
      :on-verified="onIdentityVerified"
      @close="verifyOpen = false"
    />
    <SosFlowModal
      :show="sosOpen"
      :event-guid="eventGuidParam"
      :runner="runner"
      :api-connected="apiConnected"
      @close="sosOpen = false"
      @submitted="onSosSubmitted"
    />
    <PickupGuideSheet
      :show="pickupOpen"
      :event-guid="eventGuidParam"
      :runner="runner"
      @close="pickupOpen = false"
      @view-map="openSheet('map')"
    />
    <RunnerInfoSheet
      :show="sheet === 'info'"
      :runner="runner"
      :api-connected="apiConnected"
      @close="sheet = null"
      @update="onRunnerUpdate"
    />
    <RouteMapSheet
      :show="sheet === 'map'"
      :event-guid="eventGuidParam"
      :runner-category="runner.category"
      @close="sheet = null"
    />
    <ShuttleSheet
      :show="sheet === 'shuttle'"
      :event-guid="eventGuidParam"
      :phase="phase"
      :cached-config="shuttleConfig"
      @close="sheet = null"
    />
    <LegalSheet :show="legal != null" :type="legal || 'privacy'" @close="legal = null" />
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PhaseBadge from '@/components/runner/PhaseBadge.vue'
import ChatPanel from '@/components/runner/ChatPanel.vue'
import ChatFooter from '@/components/runner/ChatFooter.vue'
import ConnectionError from '@/components/runner/ConnectionError.vue'
import RunnerTopSection from '@/components/runner/RunnerTopSection.vue'
import IdentityVerifyPopup from '@/components/runner/IdentityVerifyPopup.vue'
import SosFloatingButton from '@/components/runner/SosFloatingButton.vue'
import SosFlowModal from '@/components/runner/SosFlowModal.vue'
import PickupGuideSheet from '@/components/runner/PickupGuideSheet.vue'
import RunnerInfoSheet from '@/components/runner/RunnerInfoSheet.vue'
import RouteMapSheet from '@/components/runner/RouteMapSheet.vue'
import ShuttleSheet from '@/components/runner/ShuttleSheet.vue'
import LegalSheet from '@/components/runner/LegalSheet.vue'
import { useRunnerContext } from '@/composables/useRunnerContext.js'
import { useMpRunnerLayout } from '@/composables/useMpRunnerLayout.js'
import { isEventPublicGuid } from '@/utils/runner-api.js'
import { readPhaseOverride } from '@/utils/event-phase.js'
import { applyH5BrandTheme, brandThemeStyle } from '@/utils/h5-brand-theme.js'
import { t } from '@/utils/i18n.js'
import { isMpWeixinPlatform } from '@/utils/mp-layout.js'

const isMp = isMpWeixinPlatform()
const eventGuidParam = ref('')
const phaseOverride = ref(undefined)
const langQuery = ref(undefined)

onLoad((query) => {
  const g = query?.eventGuid?.trim() || ''
  if (!g || !isEventPublicGuid(g)) {
    uni.showToast({ title: '无效的赛事链接', icon: 'none' })
    setTimeout(() => uni.redirectTo({ url: '/pages/index' }), 1500)
    return
  }
  eventGuidParam.value = g
  phaseOverride.value = readPhaseOverride(query?.phase)
  langQuery.value = query?.lang
})

const {
  runner,
  event,
  phase,
  greeting,
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
} = useRunnerContext(eventGuidParam, { phaseOverride, langQuery })

const verifyOpen = ref(false)
const sosOpen = ref(false)
const sosToast = ref(null)
const sheet = ref(null)
const pickupOpen = ref(false)
const legal = ref(null)
const chatMaximized = ref(false)
const chatPanelRef = ref(null)
const pageInstance = getCurrentInstance()

const {
  rootLayoutStyle: mpLayoutStyle,
  messagesScrollPx,
  scheduleMeasure: scheduleMpMeasure,
  mount: mountMpLayout,
  unmount: unmountMpLayout,
} = useMpRunnerLayout(chatMaximized, pageInstance)

const mpRootStyle = computed(() => (isMp ? mpLayoutStyle.value : {}))

const brandPreset = ref(applyH5BrandTheme(null))
watch(branding, (b) => {
  brandPreset.value = applyH5BrandTheme(b)
})

const themeStyle = computed(() => brandThemeStyle(brandPreset.value))

const displayTitle = computed(
  () => branding.value?.brandTitle?.trim() || event.value.name,
)
const headerLogo = computed(() => branding.value?.logoUrl?.trim() || '')
const footerSupport = computed(() => branding.value?.footerText?.trim() || '')
const chatEnabled = computed(() => apiConnected.value && aiEnabled.value && !offlineMode.value)
const chatDisabledHint = computed(() => {
  if (offlineMode.value) return t(locale.value, 'offlineHint')
  if (!aiEnabled.value) return t(locale.value, 'aiDisabled')
  return undefined
})

const eventWithPhase = computed(() => ({ ...event.value, phase: phase.value }))

onMounted(async () => {
  if (isMp) mountMpLayout()
  if (!eventGuidParam.value) return
  await load()
  if (isMp) scheduleMpMeasure(100)
  if (apiConnected.value) startNoticePoll()
})

onUnmounted(() => {
  if (isMp) unmountMpLayout()
})

watch(loading, (isLoading) => {
  if (!isLoading && isMp) scheduleMpMeasure(150)
})

watch(
  () => identityVerified.value,
  () => {
    if (isMp) scheduleMpMeasure(200)
  },
)

function reload() {
  load().then(() => {
    if (apiConnected.value) startNoticePoll()
  })
}

function openSheet(id) {
  sheet.value = id
  pickupOpen.value = false
}

function onShortcut(id) {
  if (id === 'info' && !identityVerified.value) {
    verifyOpen.value = true
    return
  }
  if (id === 'info') sheet.value = 'info'
  if (id === 'map') sheet.value = 'map'
  if (id === 'shuttle') sheet.value = 'shuttle'
}

async function onIdentityVerified(bibNumber, idCardSuffix) {
  await verifyIdentity(bibNumber, idCardSuffix)
  uni.showToast({ title: '验证成功', icon: 'success' })
}

function onRunnerUpdate(r) {
  runner.value = r
}

function onSosSubmitted(msg) {
  sosToast.value = msg || '救援请求已受理'
  setTimeout(() => {
    sosToast.value = null
  }, 3000)
}
</script>

<style scoped>
.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.header-left {
  min-width: 0;
  flex: 1;
}
.header-text {
  min-width: 0;
}
</style>
