/**
 * Runner 页面 - 选手端主页面
 * 
 * 功能说明：
 * - 显示赛事信息、选手状态、快捷入口
 * - 提供 AI 聊天助手功能
 * - 支持聊天面板全屏/收起切换
 * - 包含 SOS 紧急救援功能
 * 
 * 布局结构：
 * - 标题栏（Logo、赛事名称、身份验证、阶段标签）
 * - 信息区（通知公告、身份验证、快捷入口）
 * - 聊天区（消息列表、快捷问题、输入框）
 * - 协议栏（隐私政策、用户协议）
 * 
 * 小程序特殊处理：
 * - 使用 useMpRunnerLayout 测量并应用布局 CSS 变量
 * - 收起态：信息区和聊天区由内容撑开高度
 * - 全屏态：聊天区覆盖信息区，占据剩余空间
 */

<template>
  <!-- 根容器：小程序环境下添加 runner 样式类 -->
  <view class="h5-root h5-root--runner" :style="mpRootStyle">
    
    <!-- 加载中状态 -->
    <view v-if="loading" class="loading-screen">
      <text>{{ t(locale, 'loadingEvent') }}</text>
    </view>

    <!-- 连接错误状态 -->
    <ConnectionError
      v-else-if="!apiConnected || error"
      :message="error || t(locale, 'connectionError')"
      :event-guid="eventGuidParam"
      @retry="reload"
    />

    <!-- 主内容区域 -->
    <view v-else class="runner-shell" :class="{ 'runner-shell--chat-maximized': isMp && chatMaximized }" :style="themeStyle">
      
      <!-- ========== 标题栏 ========== -->
      <view class="runner-header">
        <view class="header-left">
          <!-- Logo 图片或文字标记 -->
          <image v-if="headerLogo" class="logo-img" :src="headerLogo" mode="aspectFit" />
          <view v-else class="logo-mark">麦</view>
          
          <!-- 标题区域 -->
          <view class="header-text">
            <text class="header-sub">{{ locale === 'en' ? 'Duimai Runner' : '对麦智能 · 选手助手' }}</text>
            <text class="header-title">{{ displayTitle }}</text>
          </view>
        </view>
        
        <view class="header-right">
          <!-- 身份验证按钮（未验证时显示） -->
          <text v-if="!identityVerified" class="verify-pill" @tap="verifyOpen = true">
            {{ t(locale, 'verifyIdentity') }}
          </text>
          <!-- 赛事阶段标签 -->
          <PhaseBadge :phase="phase" />
        </view>
      </view>

      <!-- ========== 小程序环境内容 ========== -->
      <!-- 小程序使用自定义 flex 布局（非 Web 版本的 grid 布局） -->
      <template v-if="isMp">
        <!-- 信息区：包含通知公告、身份验证卡片、快捷入口 -->
        <view class="runner-body" :class="{ 'runner-body--collapsed': chatMaximized }">
          <view class="runner-info-scroll">
            <RunnerTopSection
              :event="eventWithPhase"
              :identity-verified="identityVerified"
              @verify="verifyOpen = true"
              @shortcut="onShortcut"
            />
          </view>
        </view>
        
        <!-- 聊天消息区：填充信息区和输入区之间的剩余空间 -->
        <view
          class="runner-chat-dock"
          :class="{ 'runner-chat-dock--maximized': chatMaximized }"
        >
          <!-- 聊天面板组件（仅 header + 消息区，不含输入区） -->
          <ChatPanel
            ref="chatPanelRef"
            class="runner-chat-panel"
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
            :hide-input="true"
            @toggle-maximize="chatMaximized = !chatMaximized"
          />
        </view>

        <!-- 聊天输入区：固定在协议栏上方 -->
        <view class="runner-chat-input-fixed">
          <scroll-view v-if="h5QuickQuestions" class="chat-prompts" scroll-x>
            <text
              v-for="(p, i) in (h5QuickQuestions[phase] || h5QuickQuestions.default || [])"
              :key="i"
              class="prompt-pill"
              :class="{ disabled: chatPanelRef?.chatInputDisabled }"
              @tap="!chatPanelRef?.chatInputDisabled && chatPanelRef?.onPrompt?.(p)"
            >
              {{ p }}
            </text>
          </scroll-view>
          <ChatInput
            class="runner-mp-chat-input"
            :disabled="chatPanelRef?.chatInputDisabled ?? !chatEnabled"
            :locale="locale"
            @send-text="onMpChatSendText"
            @voice-file="onMpChatVoiceFile"
          />
        </view>
      </template>

      <!-- ========== Web 环境内容 ========== -->
      <!-- Web 使用 grid 布局，具有不同的布局行为 -->
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
            class="runner-chat-panel"
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

      <!-- ========== SOS 紧急救援按钮 ========== -->
      <SosFloatingButton
        :disabled="!identityVerified"
        @triggered="sosOpen = true"
        @disabled-tap="verifyOpen = true"
      />

      <!-- ========== 协议栏 ========== -->
      <ChatFooter
        class="runner-footer-host"
        :footer-support="footerSupport"
        :hide-powered-by="Boolean(branding?.hidePoweredBy)"
        :locale="locale"
        @open-legal="legal = $event"
      />
    </view>

    <!-- ========== Toast 提示 ========== -->
    <view v-if="sosToast" class="sos-toast">{{ sosToast }}</view>

    <!-- ========== 弹窗组件 ========== -->
    
    <!-- 身份验证弹窗 -->
    <IdentityVerifyPopup
      :show="verifyOpen"
      :event-guid="eventGuidParam"
      :event-name="event.name"
      :on-verified="onIdentityVerified"
      @close="verifyOpen = false"
    />

    <!-- SOS 救援流程弹窗 -->
    <SosFlowModal
      :show="sosOpen"
      :event-guid="eventGuidParam"
      :runner="runner"
      :api-connected="apiConnected"
      @close="sosOpen = false"
      @submitted="onSosSubmitted"
    />

    <!-- 接驳指引弹窗 -->
    <PickupGuideSheet
      :show="pickupOpen"
      :event-guid="eventGuidParam"
      :runner="runner"
      @close="pickupOpen = false"
      @view-map="openSheet('map')"
    />

    <!-- 选手信息弹窗 -->
    <RunnerInfoSheet
      :show="sheet === 'info'"
      :runner="runner"
      :api-connected="apiConnected"
      @close="sheet = null"
      @update="onRunnerUpdate"
    />

    <!-- 路线地图弹窗 -->
    <RouteMapSheet
      :show="sheet === 'map'"
      :event-guid="eventGuidParam"
      :runner-category="runner.category"
      @close="sheet = null"
    />

    <!-- 接驳车辆弹窗 -->
    <ShuttleSheet
      :show="sheet === 'shuttle'"
      :event-guid="eventGuidParam"
      :phase="phase"
      :cached-config="shuttleConfig"
      @close="sheet = null"
    />

    <!-- 法律声明弹窗（隐私政策、用户协议） -->
    <LegalSheet :show="legal != null" :type="legal || 'privacy'" @close="legal = null" />

    <!-- #ifdef MP-WEIXIN -->
    <text
      class="iconfont iconfont-glyph iconfont-preload"
      :style="mpIconPreloadStyle"
      aria-hidden="true"
    >{{ mpIconPreloadGlyph }}</text>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { isMpWeixinPlatform } from '@/utils/mp-layout.js'
import { t } from '@/utils/i18n.js'
import { applyH5BrandTheme, brandThemeStyle } from '@/utils/h5-brand-theme.js'
import { readPhaseOverride } from '@/utils/event-phase.js'
import { isEventPublicGuid } from '@/utils/runner-api.js'
import { useRunnerContext } from '@/composables/useRunnerContext.js'
import { useMpRunnerLayout } from '@/composables/useMpRunnerLayout.js'
import ConnectionError from '@/components/runner/ConnectionError.vue'
import PhaseBadge from '@/components/runner/PhaseBadge.vue'
import RunnerTopSection from '@/components/runner/RunnerTopSection.vue'
import ChatPanel from '@/components/runner/ChatPanel.vue'
import ChatInput from '@/components/runner/ChatInput.vue'
import SosFloatingButton from '@/components/runner/SosFloatingButton.vue'
import ChatFooter from '@/components/runner/ChatFooter.vue'
import IdentityVerifyPopup from '@/components/runner/IdentityVerifyPopup.vue'
import SosFlowModal from '@/components/runner/SosFlowModal.vue'
import PickupGuideSheet from '@/components/runner/PickupGuideSheet.vue'
import RunnerInfoSheet from '@/components/runner/RunnerInfoSheet.vue'
import RouteMapSheet from '@/components/runner/RouteMapSheet.vue'
import ShuttleSheet from '@/components/runner/ShuttleSheet.vue'
import LegalSheet from '@/components/runner/LegalSheet.vue'
// #ifdef MP-WEIXIN
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'
// #endif

/**
 * ========================================
 * 脚本部分 - 常量定义
 * ========================================
 */

// 检测是否为微信小程序环境
const isMp = isMpWeixinPlatform()

// #ifdef MP-WEIXIN
const mpIconPreloadGlyph = getIconGlyph('mic')
const mpIconPreloadStyle = iconfontStyle('1px', 'transparent')
// #endif

// URL 参数
const eventGuidParam = ref('')          // 赛事 GUID（从 URL 获取）
const phaseOverride = ref(undefined)    // 阶段覆盖值（用于调试）
const langQuery = ref(undefined)        // 语言查询参数

/**
 * ========================================
 * 脚本部分 - 页面加载
 * ========================================
 */

// 页面加载时执行，验证赛事 GUID 的有效性
onLoad((query) => {
  // 获取 URL 中的 eventGuid 参数
  const g = query?.eventGuid?.trim() || ''
  
  // 验证 GUID 格式，无效则重定向到首页
  if (!g || !isEventPublicGuid(g)) {
    uni.showToast({ title: '无效的赛事链接', icon: 'none' })
    setTimeout(() => uni.redirectTo({ url: '/pages/index' }), 1500)
    return
  }
  
  // 设置赛事 GUID
  eventGuidParam.value = g
  
  // 设置阶段覆盖（用于测试）
  phaseOverride.value = readPhaseOverride(query?.phase)
  
  // 设置语言
  langQuery.value = query?.lang
})

/**
 * ========================================
 * 脚本部分 - 核心数据
 * ========================================
 */

// 使用 runner context 获取所有核心数据
const {
  runner,                // 选手信息（号码簿、姓名等）
  event,                 // 赛事信息（名称、时间等）
  phase,                 // 当前阶段（检录中、比赛中等）
  greeting,              // AI 助手问候语
  h5QuickQuestions,       // 快捷问题列表
  branding,               // 品牌定制（Logo、颜色等）
  shuttleConfig,          // 接驳车配置
  locale,                 // 当前语言（zh/en）
  offlineMode,            // 是否离线模式
  aiEnabled,              // AI 功能是否启用
  identityVerified,       // 是否已验证身份
  loading,                // 是否加载中
  error,                  // 错误信息
  apiConnected,           // API 是否已连接
  load,                   // 加载数据函数
  startNoticePoll,        // 启动通知轮询
  verifyIdentity,         // 身份验证函数
} = useRunnerContext(eventGuidParam, { phaseOverride, langQuery })

/**
 * ========================================
 * 脚本部分 - UI 状态
 * ========================================
 */

// 弹窗控制
const verifyOpen = ref(false)    // 身份验证弹窗
const sosOpen = ref(false)       // SOS 救援弹窗
const sheet = ref(null)         // 底部弹窗（info/map/shuttle）
const legal = ref(null)          // 法律声明弹窗类型（privacy/terms）
const pickupOpen = ref(false)   // 接驳指引弹窗

// 聊天状态
const chatMaximized = ref(false)  // 聊天面板是否全屏
const chatPanelRef = ref(null)     // 聊天面板组件引用

// SOS 提示
const sosToast = ref(null)  // 临时显示的提示信息

// 页面实例（用于小程序选择器查询）
const pageInstance = getCurrentInstance()

/**
 * ========================================
 * 脚本部分 - 布局控制器（小程序专用）
 * ========================================
 */

// 创建小程序布局控制器
const {
  rootLayoutStyle: mpLayoutStyle,  // 包含 CSS 变量的根样式
  messagesScrollPx,                  // 消息滚动区域高度
  scheduleMeasure: scheduleMpMeasure,  // 防抖调度测量
  mount: mountMpLayout,              // 挂载
  unmount: unmountMpLayout,          // 卸载
} = useMpRunnerLayout(chatMaximized, pageInstance)

// 根元素样式（小程序环境有额外样式）
const mpRootStyle = computed(() => (isMp ? mpLayoutStyle.value : {}))

/**
 * ========================================
 * 脚本部分 - 品牌主题
 * ========================================
 */

// 品牌预设（用于主题定制）
const brandPreset = ref(applyH5BrandTheme(null))

// 当 branding 变化时，更新品牌预设
watch(branding, (b) => {
  brandPreset.value = applyH5BrandTheme(b)
})

// 计算主题样式
const themeStyle = computed(() => brandThemeStyle(brandPreset.value))

/**
 * ========================================
 * 脚本部分 - 计算属性
 * ========================================
 */

// 显示标题（优先使用品牌标题，否则使用赛事名称）
const displayTitle = computed(
  () => branding.value?.brandTitle?.trim() || event.value.name,
)

// 头部 Logo URL
const headerLogo = computed(() => branding.value?.logoUrl?.trim() || '')

// 底部支持文案
const footerSupport = computed(() => branding.value?.footerText?.trim() || '')

// 聊天是否可用（需要：API 连接、AI 启用、非离线模式）
const chatEnabled = computed(() => apiConnected.value && aiEnabled.value && !offlineMode.value)

// 聊天禁用原因提示
const chatDisabledHint = computed(() => {
  if (offlineMode.value) return t(locale.value, 'offlineHint')
  if (!aiEnabled.value) return t(locale.value, 'aiDisabled')
  return undefined
})

// 带阶段的赛事数据（用于传递给子组件）
const eventWithPhase = computed(() => ({ ...event.value, phase: phase.value }))

/**
 * ========================================
 * 脚本部分 - 生命周期
 * ========================================
 */

// 组件挂载
onMounted(async () => {
  // 小程序环境挂载布局控制器
  if (isMp) mountMpLayout()
  
  // 如果没有赛事 GUID，不继续加载
  if (!eventGuidParam.value) return
  
  // 加载数据
  await load()
  
  // 小程序环境调度测量
  if (isMp) scheduleMpMeasure(100)
  
  // 启动通知轮询
  if (apiConnected.value) startNoticePoll()
})

// 组件卸载
onUnmounted(() => {
  // 小程序环境卸载布局控制器
  if (isMp) unmountMpLayout()
})

// 监听加载状态变化
watch(loading, (isLoading) => {
  if (!isLoading && isMp) scheduleMpMeasure(150)
})

// 监听身份验证状态变化
watch(
  () => identityVerified.value,
  () => {
    if (isMp) scheduleMpMeasure(200)
  },
)

/**
 * ========================================
 * 脚本部分 - 方法函数
 * ========================================
 */

/**
 * 重新加载数据
 * 用于连接错误后的重试
 */
function reload() {
  load().then(() => {
    if (apiConnected.value) startNoticePoll()
  })
}

/**
 * 打开底部弹窗
 * 
 * @param {string} id - 弹窗类型：info(选手信息) / map(路线地图) / shuttle(接驳车)
 */
function openSheet(id) {
  sheet.value = id
  pickupOpen.value = false
}

/**
 * 快捷入口点击处理
 * 
 * @param {string} id - 入口类型：info / map / shuttle
 */
function onShortcut(id) {
  // info 入口需要先验证身份
  if (id === 'info' && !identityVerified.value) {
    verifyOpen.value = true
    return
  }
  
  // 根据类型打开对应弹窗
  if (id === 'info') sheet.value = 'info'
  if (id === 'map') sheet.value = 'map'
  if (id === 'shuttle') sheet.value = 'shuttle'
}

/**
 * 身份验证成功回调
 * 
 * @param {string} bibNumber - 号码簿号码
 * @param {string} idCardSuffix - 身份证后4位
 */
async function onIdentityVerified(bibNumber, idCardSuffix) {
  // 执行验证
  await verifyIdentity(bibNumber, idCardSuffix)
  
  // 显示成功提示
  uni.showToast({ title: '验证成功', icon: 'success' })
}

/**
 * 选手信息更新回调
 * 
 * @param {Object} r - 更新后的选手数据
 */
function onRunnerUpdate(r) {
  runner.value = r
}

function onMpChatSendText(text) {
  chatPanelRef.value?.sendTextMessage?.(text)
}

function onMpChatVoiceFile(payload) {
  chatPanelRef.value?.onVoiceFile?.(payload)
}

/**
 * SOS 提交成功回调
 * 
 * @param {string} msg - 提交后返回的消息
 */
function onSosSubmitted(msg) {
  // 显示临时提示
  sosToast.value = msg || '救援请求已受理'
  
  // 3秒后自动隐藏提示
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
