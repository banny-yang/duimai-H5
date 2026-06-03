<template>
  <view
    class="chat-section"
    :class="{
      'chat-section--maximized': maximized,
      'chat-section--mp': useMpScrollFill,
    }"
    :style="sectionStyle"
  >
    <view class="chat-section-header">
      <view class="chat-header-title-wrap">
        <text class="chat-title">AI 赛事助手</text>
      </view>
      <view class="header-right">
        <view
          v-if="showMaximize"
          class="chat-max-btn"
          role="button"
          :aria-label="maximized ? '恢复聊天窗口大小' : '最大化聊天窗口'"
          @tap="$emit('toggle-maximize')"
        >
          <!-- #ifdef MP-WEIXIN -->
          <text class="chat-max-btn-text">{{ maximized ? '收起' : '全屏' }}</text>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <ChatMaximizeIcon :maximized="maximized" />
          <!-- #endif -->
        </view>
        <!-- #ifndef MP-WEIXIN -->
        <text class="chat-status" :class="{ ok: chatEnabled }">{{ statusLabelShort }}</text>
        <!-- #endif -->
      </view>
    </view>

    <view class="chat-messages-area">
      <scroll-view
        class="chat-messages"
        scroll-y
        :style="messagesScrollStyle"
        :scroll-into-view="scrollIntoView"
        scroll-with-animation
        @scroll="onScroll"
      >
        <view v-for="m in messages" :key="m.id" :id="'msg-' + m.id">
          <ChatMessageItem
            :message="m"
            :runner="runner"
            :greeting="m.id === 'greet' ? greeting : undefined"
          />
        </view>
        <view v-if="thinking" class="chat-thinking">
          <view class="chat-thinking-dot" />
          <view class="chat-thinking-dot" style="animation-delay: 0.15s" />
          <view class="chat-thinking-dot" style="animation-delay: 0.3s" />
          <text>对麦正在思考</text>
        </view>
        <view v-if="chatError" class="chat-error">{{ chatError }}</view>
        <view id="msg-bottom" style="height: 2px" />
      </scroll-view>
      <text v-if="showScrollBtn" class="chat-scroll-fab" @tap="scrollBottom">↓ 回到底部</text>
    </view>

    <view class="chat-input-footer">
      <scroll-view v-if="prompts.length" class="chat-prompts" scroll-x>
        <text
          v-for="(p, i) in prompts"
          :key="i"
          class="prompt-pill"
          :class="{ disabled: thinking || !chatEnabled }"
          @tap="onPrompt(p)"
        >
          {{ p }}
        </text>
      </scroll-view>
      <ChatInput
        :disabled="thinking || !chatEnabled"
        :locale="locale"
        @send-text="sendTextMessage"
        @voice-file="onVoiceFile"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue'
import ChatInput from './ChatInput.vue'
import ChatMessageItem from './ChatMessageItem.vue'
import ChatMaximizeIcon from '@/components/icons/ChatMaximizeIcon.vue'
import {
  sendChat,
  transcribeSpeech,
  fetchChatInbox,
  fetchChatHistory,
} from '@/utils/runner-api.js'
import { mapHistoryToChatMessages } from '@/utils/chat-history.js'
import { resolveQuickPrompts } from '@/utils/event-phase.js'
import {
  subscribeRunnerChatHumanReply,
  subscribeRunnerChatSocketOpen,
  getRunnerChatSocketState,
  subscribeRunnerChatSocketState,
} from '@/utils/runner-chat-ws.js'
import { ApiError } from '@/utils/api.js'
import { t } from '@/utils/i18n.js'
import { isMpWeixinPlatform } from '@/utils/mp-layout.js'

const props = defineProps({
  phase: { type: String, default: 'pre' },
  greeting: { type: String, default: '' },
  runner: { type: Object, default: () => ({}) },
  chatEnabled: Boolean,
  chatDisabledHint: String,
  offlineHint: String,
  h5QuickQuestions: Object,
  inboxPollEnabled: Boolean,
  historyEnabled: Boolean,
  runnerId: String,
  maximized: Boolean,
  showMaximize: { type: Boolean, default: true },
  locale: { type: String, default: 'zh' },
  /** 小程序 scroll-view 需 px 高度时由父级传入（可选） */
  sectionStyle: { type: Object, default: () => ({}) },
})
defineEmits(['toggle-maximize'])

const messages = ref([
  { id: 'greet', role: 'assistant', text: '', createdAt: Date.now() },
])
const thinking = ref(false)
const chatError = ref(null)
const scrollIntoView = ref('')
const showScrollBtn = ref(false)
const conversationId = ref(undefined)
const deliveredInboxIds = new Set()
const wsOpen = ref(false)
let inboxTimer = null
let unsubWs = null
let unsubOpen = null
let unsubState = null
const nearBottom = ref(true)

/** 微信 scroll-view 高度（消息区实测，配合绝对定位布局） */
const messagesScrollPx = ref(0)
const useMpScrollFill = isMpWeixinPlatform()
let measureTimer = null

function measureMessagesScrollHeight() {
  if (!useMpScrollFill) return
  nextTick(() => {
    const query = uni.createSelectorQuery()
    const inst = getCurrentInstance()
    if (inst?.proxy) query.in(inst.proxy)
    query.select('.chat-section').boundingClientRect()
    query.select('.chat-section-header').boundingClientRect()
    query.select('.chat-input-footer').boundingClientRect()
    query.select('.chat-messages-area').boundingClientRect()
    query.exec((res) => {
      const section = res?.[0]
      const header = res?.[1]
      const input = res?.[2]
      const area = res?.[3]
      if (section?.height > 0) {
        const h =
          section.height -
          (Number(header?.height) || 0) -
          (Number(input?.height) || 0)
        if (h > 48) {
          messagesScrollPx.value = Math.floor(h)
          return
        }
      }
      if (area?.height > 48) {
        messagesScrollPx.value = Math.floor(area.height)
      }
    })
  })
}

function scheduleMeasureMessages() {
  if (!useMpScrollFill) return
  if (measureTimer) clearTimeout(measureTimer)
  measureTimer = setTimeout(measureMessagesScrollHeight, 80)
  setTimeout(measureMessagesScrollHeight, 280)
  setTimeout(measureMessagesScrollHeight, 600)
}

const messagesScrollStyle = computed(() => {
  if (useMpScrollFill && messagesScrollPx.value > 0) {
    return {
      height: `${messagesScrollPx.value}px`,
      width: '100%',
      boxSizing: 'border-box',
    }
  }
  return { height: '100%', width: '100%', boxSizing: 'border-box' }
})

watch(
  () => [props.sectionStyle, props.maximized],
  () => scheduleMeasureMessages(),
  { deep: true },
)

defineExpose({ remeasure: scheduleMeasureMessages })

const prompts = computed(() =>
  resolveQuickPrompts(props.phase, props.h5QuickQuestions),
)

const statusLabel = computed(() => {
  if (props.chatEnabled) return '已连接 AI'
  return props.chatDisabledHint || props.offlineHint || t(props.locale, 'aiDisabled')
})

/** 标题栏优先保证最大化按钮可见 */
const statusLabelShort = computed(() => {
  if (props.chatEnabled) return '已连接'
  const full = statusLabel.value
  if (!full) return ''
  return full.length > 8 ? `${full.slice(0, 8)}…` : full
})

function uid() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function scrollBottom() {
  nearBottom.value = true
  showScrollBtn.value = false
  scrollIntoView.value = ''
  setTimeout(() => {
    scrollIntoView.value = 'msg-bottom'
  }, 30)
}

function onScroll(e) {
  const detail = e.detail
  const dist = detail.scrollHeight - detail.scrollTop - (detail.deltaY || 400)
  nearBottom.value = dist < 80
  showScrollBtn.value = !nearBottom.value
}

async function streamText(streamId, fullText) {
  for (let i = 1; i <= fullText.length; i++) {
    await new Promise((r) => setTimeout(r, 16))
    const slice = fullText.slice(0, i)
    messages.value = messages.value.map((m) =>
      m.id === streamId ? { ...m, text: slice, streaming: i < fullText.length } : m,
    )
  }
}

async function appendStaff(items) {
  for (const item of items) {
    if (!item.id || !item.text?.trim() || deliveredInboxIds.has(item.id)) continue
    deliveredInboxIds.add(item.id)
    messages.value.push({
      id: item.id,
      role: 'staff',
      text: item.text.trim(),
      createdAt: item.createdAt ?? Date.now(),
    })
  }
  if (nearBottom.value) scrollBottom()
}

async function drainInbox() {
  try {
    const inbox = await fetchChatInbox()
    if (!inbox?.length) return
    const fresh = inbox.filter(
      (m) => m.id && m.text?.trim() && !deliveredInboxIds.has(m.id),
    )
    if (fresh.length) await appendStaff(fresh)
  } catch {
    /* 静默 */
  }
}

async function loadHistory() {
  if (!props.historyEnabled || !props.runnerId || props.runnerId === 'visitor') return
  try {
    const res = await fetchChatHistory()
    if (res.conversationId) conversationId.value = res.conversationId
    const loaded = mapHistoryToChatMessages(res.messages ?? [])
    if (!loaded.length) return
    for (const m of loaded) {
      if (m.id.startsWith('hist-')) deliveredInboxIds.add(m.id)
    }
    const greet = messages.value.find((m) => m.id === 'greet')
    const byId = new Map()
    for (const m of messages.value) {
      if (m.id !== 'greet') byId.set(m.id, m)
    }
    for (const m of loaded) byId.set(m.id, m)
    const merged = [...byId.values()].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
    messages.value = greet ? [greet, ...merged] : merged
    scrollBottom()
  } catch {
    /* 静默 */
  }
}

async function appendReply(answer) {
  const fullText = answer?.trim()
  if (!fullText) {
    chatError.value = '助手未返回内容'
    return
  }
  const streamId = uid()
  messages.value.push({
    id: streamId,
    role: 'assistant',
    text: '',
    streaming: true,
    createdAt: Date.now(),
  })
  await streamText(streamId, fullText)
}

async function sendQueryToAi(text, voiceMeta) {
  if (thinking.value) return
  if (!props.chatEnabled) {
    chatError.value = props.chatDisabledHint || props.offlineHint || t(props.locale, 'aiDisabled')
    return
  }
  thinking.value = true
  chatError.value = null
  try {
    const res = await sendChat({
      query: text,
      conversationId: conversationId.value,
      ...(voiceMeta
        ? { inputSource: 'voice', voiceDurationMs: voiceMeta.durationMs }
        : {}),
    })
    if (res.conversationId) conversationId.value = res.conversationId
    await appendReply(res.answer)
    if (nearBottom.value) scrollBottom()
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : '对话请求失败'
    if (/conversation not exists/i.test(msg)) conversationId.value = undefined
    chatError.value = msg
  } finally {
    thinking.value = false
  }
}

async function sendTextMessage(text) {
  if (thinking.value) return
  messages.value.push({ id: uid(), role: 'user', text, createdAt: Date.now() })
  scrollBottom()
  await sendQueryToAi(text)
}

async function onVoiceFile({ filePath, blob, durationMs }) {
  if (thinking.value || !props.chatEnabled) return
  const msgId = uid()
  messages.value.push({
    id: msgId,
    role: 'user',
    voiceStatus: 'transcribing',
    createdAt: Date.now(),
  })
  scrollBottom()
  thinking.value = true
  try {
    const res = await transcribeSpeech(blob || filePath)
    const text = res.text?.trim()
    if (!text) {
      messages.value = messages.value.map((m) =>
        m.id === msgId ? { ...m, voiceStatus: 'failed' } : m,
      )
      chatError.value = '未识别到有效语音'
      return
    }
    messages.value = messages.value.map((m) =>
      m.id === msgId
        ? { ...m, voiceStatus: 'done', text, inputSource: 'voice' }
        : m,
    )
    await sendQueryToAi(text, { durationMs: durationMs || res.durationMs })
  } catch (e) {
    messages.value = messages.value.map((m) =>
      m.id === msgId ? { ...m, voiceStatus: 'failed' } : m,
    )
    chatError.value = e instanceof ApiError ? e.message : '语音识别失败'
  } finally {
    thinking.value = false
  }
}

function onPrompt(p) {
  if (thinking.value || !props.chatEnabled) return
  sendTextMessage(p)
}

function setupInboxPoll() {
  if (inboxTimer) clearInterval(inboxTimer)
  inboxTimer = null
  if (!props.inboxPollEnabled) return
  const ms = wsOpen.value ? 15000 : 800
  inboxTimer = setInterval(drainInbox, ms)
}

function teardownInbox() {
  if (unsubWs) {
    unsubWs()
    unsubWs = null
  }
  if (unsubOpen) {
    unsubOpen()
    unsubOpen = null
  }
  if (unsubState) {
    unsubState()
    unsubState = null
  }
  if (inboxTimer) {
    clearInterval(inboxTimer)
    inboxTimer = null
  }
}

watch(
  () => props.inboxPollEnabled,
  (on) => {
    teardownInbox()
    if (!on) return
    unsubWs = subscribeRunnerChatHumanReply((m) => appendStaff([m]))
    unsubOpen = subscribeRunnerChatSocketOpen(() => drainInbox())
    unsubState = subscribeRunnerChatSocketState(() => {
      wsOpen.value = getRunnerChatSocketState() === 'open'
      setupInboxPoll()
    })
    wsOpen.value = getRunnerChatSocketState() === 'open'
    drainInbox()
    setupInboxPoll()
  },
  { immediate: true },
)

watch(
  () => [messages.value.length, thinking.value],
  () => {
    if (nearBottom.value) scrollBottom()
  },
)

watch(
  () => prompts.value.length,
  () => scheduleMeasureMessages(),
)

onMounted(() => {
  loadHistory()
  scheduleMeasureMessages()
  setTimeout(scheduleMeasureMessages, 400)
})

watch(
  () => props.maximized,
  () => {
    scheduleMeasureMessages()
    setTimeout(scheduleMeasureMessages, 320)
  },
)

watch(
  () => messages.value.length,
  () => scheduleMeasureMessages(),
)

onUnmounted(() => {
  if (measureTimer) clearTimeout(measureTimer)
  teardownInbox()
})
</script>

<style scoped>
.chat-header-title-wrap {
  flex: 1;
  min-width: 0;
  margin-right: 12rpx;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
  margin-left: auto;
}
</style>
