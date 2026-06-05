<template>
  <view class="chat-input-wrap">
    <text v-if="voiceHint && !voiceMode" class="voice-hint">{{ voiceHint }}</text>
    <view v-if="voiceError" class="voice-error">{{ voiceError }}</view>

    <view v-if="voiceMode" class="voice-row">
      <view
        class="icon-tap"
        :class="{ 'icon-tap--disabled': disabled || isRecording }"
        aria-label="切换到键盘输入"
        @tap="!disabled && !isRecording && exitVoiceMode()"
      >
        <KeyboardIcon />
      </view>
      <view
        class="hold-speak"
        :class="{
          'hold-speak--recording': isRecording,
          'hold-speak--disabled': disabled,
        }"
        @touchstart.prevent="onHoldStart"
        @touchend.prevent="onHoldEnd"
        @touchcancel.prevent="onHoldCancel"
        @mousedown.prevent="onHoldStart"
        @mouseup.prevent="onHoldEnd"
        @mouseleave.prevent="onHoldCancel"
      >
        <view v-if="isRecording" class="hold-waves" aria-hidden="true">
          <view
            v-for="i in 5"
            :key="i"
            class="hold-wave-bar"
            :style="{ animationDelay: `${(i - 1) * 0.12}s` }"
          />
        </view>
        <text class="hold-label">{{ isRecording ? '松开 结束' : '按住 说话' }}</text>
        <view v-if="isRecording" class="hold-progress">
          <view class="hold-progress-fill" :style="{ width: recordProgressPct }" />
        </view>
      </view>
    </view>

    <view v-else class="text-row">
      <view
        v-if="showMicButton"
        class="icon-tap"
        :class="{ 'icon-tap--disabled': disabled || !voiceSupported }"
        aria-label="切换到语音输入"
        @tap="onMicTap"
      >
        <MicIcon />
      </view>

      <view
        class="input-shell"
        :class="{ 'input-shell--focus': inputFocused, 'input-shell--disabled': disabled }"
      >
        <input
          class="chat-input-field"
          v-model="text"
          :disabled="disabled"
          :placeholder="placeholder"
          placeholder-class="input-placeholder"
          confirm-type="send"
          :adjust-position="true"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
          @confirm="sendText"
        />
      </view>

      <button
        class="send-btn"
        :class="{ active: text.trim() }"
        :disabled="disabled || !text.trim()"
        @tap="sendText"
      >
        <!-- #ifdef H5 -->
        <svg class="send-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.4 20.6 20.6 12 3.4 3.4l2.8 7.2L16 12l-9.8 1.4-2.8 7.2z" />
        </svg>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <text
          class="iconfont iconfont-glyph send-iconfont"
          :style="sendIconStyle"
        >{{ sendGlyph }}</text>
        <!-- #endif -->
        <!-- #ifndef H5 || MP-WEIXIN -->
        <svg class="send-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.4 20.6 20.6 12 3.4 3.4l2.8 7.2L16 12l-9.8 1.4-2.8 7.2z" />
        </svg>
        <!-- #endif -->
        <text class="send-label">发送</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MicIcon from '@/components/icons/MicIcon.vue'
import KeyboardIcon from '@/components/icons/KeyboardIcon.vue'
import { fetchSpeechToTextStatus } from '@/utils/runner-api.js'
import { isVoiceInputSupported, voiceUnsupportedHint } from '@/utils/voice-capability.js'
import { clampVoiceDurationMs, VOICE_MIN_RECORD_MS } from '@/utils/voice-message.js'
import { t } from '@/utils/i18n.js'
import { isMpWeixinPlatform } from '@/utils/mp-layout.js'
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'

// #ifdef H5
import { useVoiceRecorderH5 } from '@/composables/useVoiceRecorderH5.js'
// #endif

const props = defineProps({
  disabled: Boolean,
  locale: { type: String, default: 'zh' },
})
const emit = defineEmits(['send-text', 'voice-file'])

const text = ref('')
const voiceMode = ref(false)
const voiceSupported = ref(false)
const voiceHint = ref('')
const voiceError = ref(null)
const inputFocused = ref(false)
const placeholder = t(props.locale, 'sendPlaceholder')
const isMp = isMpWeixinPlatform()
const showMicButton = computed(() => isMp || voiceSupported.value)

const sendGlyph = computed(() =>
  getIconGlyph(text.value.trim() ? 'send-fill' : 'send'),
)
const sendIconStyle = computed(() =>
  iconfontStyle('32rpx', text.value.trim() ? '#fff' : ''),
)

// #ifdef H5
const h5Voice = useVoiceRecorderH5()
const isRecording = computed(() => h5Voice.phase.value === 'recording')
// #endif

// #ifndef H5
const recording = ref(false)
const isRecording = computed(() => recording.value)
const progressMs = ref(0)
let progressTimer = null
let mpRecorder = null
let suppressVoiceEmit = false
let recordStartedAt = 0
// #endif

const recordProgressPct = computed(() => {
  if (!isRecording.value) return '0%'
  // #ifdef H5
  const p = Math.min(1, h5Voice.elapsedMs.value / h5Voice.maxMs)
  return `${Math.round(p * 100)}%`
  // #endif
  // #ifndef H5
  const p = Math.min(1, progressMs.value / 60000)
  return `${Math.round(p * 100)}%`
  // #endif
})

// #ifndef H5
watch(isRecording, (rec) => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  progressMs.value = 0
  if (!rec) return
  progressTimer = setInterval(() => {
    progressMs.value = Math.min(60000, progressMs.value + 100)
  }, 100)
})
// #endif

onMounted(async () => {
  voiceSupported.value = isVoiceInputSupported()
  if (!voiceSupported.value) {
    voiceHint.value = voiceUnsupportedHint()
  }

  try {
    const st = await fetchSpeechToTextStatus()
    if (st?.enabled === false) {
      voiceSupported.value = false
      voiceHint.value = '语音识别暂未开放，请使用文字输入'
    }
  } catch {
    /* 默认可用 */
  }

  // #ifndef H5
  if (voiceSupported.value && typeof uni.getRecorderManager === 'function') {
    mpRecorder = uni.getRecorderManager()
    mpRecorder.onStop((res) => {
      recording.value = false
      if (suppressVoiceEmit) {
        suppressVoiceEmit = false
        return
      }
      if (!res.tempFilePath) return
      const elapsed = Math.max(0, Date.now() - recordStartedAt)
      let rawDuration = res.duration || elapsed
      // 少数基础库把 duration 当成秒
      if (rawDuration > 0 && rawDuration < 1000 && elapsed >= 1000) {
        rawDuration *= 1000
      }
      if (!rawDuration || rawDuration < VOICE_MIN_RECORD_MS) rawDuration = elapsed
      const durationMs = clampVoiceDurationMs(rawDuration)
      if (durationMs < VOICE_MIN_RECORD_MS) {
        voiceError.value = '说话时间太短，请按住至少 0.5 秒'
        return
      }
      emit('voice-file', { filePath: res.tempFilePath, durationMs })
    })
    mpRecorder.onError(() => {
      recording.value = false
      voiceError.value = '录音失败'
    })
  }
  // #endif
})

onUnmounted(() => {
  // #ifdef H5
  h5Voice.cancel()
  // #endif
  // #ifndef H5
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  if (recording.value && mpRecorder) {
    try {
      mpRecorder.stop()
    } catch {
      /* ignore */
    }
  }
  // #endif
})

function sendText() {
  const v = text.value.trim()
  if (!v || props.disabled) return
  text.value = ''
  emit('send-text', v)
}

function onMicTap() {
  if (props.disabled) return
  if (!voiceSupported.value) {
    const hint = voiceHint.value || voiceUnsupportedHint()
    if (hint) uni.showToast({ title: hint, icon: 'none' })
    return
  }
  enterVoiceMode()
}

function enterVoiceMode() {
  if (props.disabled || !voiceSupported.value) return
  voiceError.value = null
  voiceMode.value = true
}

function exitVoiceMode() {
  // #ifdef H5
  if (isRecording.value) h5Voice.cancel()
  // #endif
  // #ifndef H5
  discardMpRecording()
  // #endif
  voiceMode.value = false
  voiceError.value = null
}

// #ifndef H5
function discardMpRecording() {
  if (!recording.value || !mpRecorder) return
  suppressVoiceEmit = true
  recording.value = false
  try {
    mpRecorder.stop()
  } catch {
    suppressVoiceEmit = false
  }
}

function ensureRecordPermission() {
  return new Promise((resolve) => {
    uni.getSetting({
      success: ({ authSetting }) => {
        if (authSetting['scope.record']) {
          resolve(true)
          return
        }
        uni.authorize({
          scope: 'scope.record',
          success: () => resolve(true),
          fail: () => {
            uni.showModal({
              title: '需要录音权限',
              content: '语音输入需使用麦克风，请在设置中开启录音权限',
              confirmText: '去设置',
              success: (modalRes) => {
                if (!modalRes.confirm) {
                  resolve(false)
                  return
                }
                uni.openSetting({
                  success: (settingRes) =>
                    resolve(!!settingRes.authSetting['scope.record']),
                  fail: () => resolve(false),
                })
              },
            })
          },
        })
      },
      fail: () => resolve(false),
    })
  })
}
// #endif

async function onHoldStart() {
  if (props.disabled || isRecording.value) return
  voiceError.value = null

  // #ifdef H5
  const ok = await h5Voice.start()
  if (!ok) {
    if (h5Voice.phase.value === 'denied') {
      voiceError.value = '请允许使用麦克风'
      h5Voice.resetDenied()
    } else if (h5Voice.phase.value === 'unsupported') {
      voiceError.value = voiceUnsupportedHint()
    }
  }
  // #endif

  // #ifndef H5
  if (!mpRecorder) return
  const allowed = await ensureRecordPermission()
  if (!allowed) {
    voiceError.value = '请允许使用麦克风'
    return
  }
  recordStartedAt = Date.now()
  recording.value = true
  mpRecorder.start({
    format: 'mp3',
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
  })
  // #endif
}

async function onHoldEnd() {
  // #ifdef H5
  if (!isRecording.value) return
  const durationMs = clampVoiceDurationMs(h5Voice.elapsedMs.value)
  const blob = await h5Voice.stop()
  if (!blob) {
    voiceError.value = '说话时间太短，请按住至少 0.5 秒'
    return
  }
  emit('voice-file', { blob, durationMs })
  // #endif

  // #ifndef H5
  if (!recording.value || !mpRecorder) return
  mpRecorder.stop()
  // #endif
}

function onHoldCancel() {
  // #ifdef H5
  if (isRecording.value) h5Voice.cancel()
  // #endif
  // #ifndef H5
  discardMpRecording()
  // #endif
}
</script>

<style scoped>
.chat-input-wrap {
  padding: 12rpx 24rpx 20rpx;
}
.voice-hint {
  display: block;
  font-size: 22rpx;
  color: var(--secondary-text);
  margin-bottom: 8rpx;
  line-height: 1.4;
}
.voice-error {
  font-size: 24rpx;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  margin-bottom: 8rpx;
}
.text-row,
.voice-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

/* 图标按钮：无边框、无底色，仅图标 */
.icon-tap {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--secondary-text);
}
.icon-tap:active:not(.icon-tap--disabled) {
  color: var(--primary);
  opacity: 0.85;
}
.icon-tap--disabled {
  opacity: 0.4;
}

.input-shell {
  flex: 1;
  min-width: 0;
  min-height: 88rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(255, 102, 0, 0.28);
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input-shell--focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 6rpx rgba(255, 102, 0, 0.1);
}
.input-shell--disabled {
  background: var(--secondary-bg);
  border-color: var(--secondary-border);
  box-shadow: none;
}
.chat-input-field {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: var(--ink);
  background: transparent;
  box-sizing: border-box;
}

.send-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  height: 80rpx;
  padding: 0 24rpx;
  margin: 0;
  border: none;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  background: var(--secondary-border);
  color: var(--secondary-text);
}
.send-btn.active {
  background: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-primary-sm);
}
.send-btn[disabled] {
  opacity: 0.55;
}
.send-svg {
  width: 32rpx;
  height: 32rpx;
}
/* #ifdef MP-WEIXIN */
.send-iconfont {
  flex-shrink: 0;
}
/* #endif */
.send-label {
  font-size: 28rpx;
}

.hold-speak {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  border-radius: 999rpx;
  border: 2px solid rgba(255, 102, 0, 0.22);
  background: linear-gradient(180deg, #fff 0%, var(--primary-surface) 100%);
  box-shadow: 0 2rpx 12rpx rgba(255, 102, 0, 0.08);
  overflow: hidden;
  transition:
    transform 0.12s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.hold-speak:active:not(.hold-speak--disabled):not(.hold-speak--recording) {
  transform: scale(0.985);
  border-color: rgba(255, 102, 0, 0.45);
  background: var(--primary-surface);
}
.hold-speak--recording {
  border-color: var(--primary);
  background: rgba(255, 102, 0, 0.1);
  box-shadow:
    0 0 0 6rpx rgba(255, 102, 0, 0.12),
    0 4rpx 16rpx rgba(255, 102, 0, 0.18);
  transform: scale(0.98);
}
.hold-speak--disabled {
  opacity: 0.5;
}
.hold-label {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.02em;
  z-index: 1;
}
.hold-speak--recording .hold-label {
  color: var(--primary-deeper);
}
.hold-waves {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  height: 32rpx;
  z-index: 1;
}
.hold-wave-bar {
  width: 6rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: var(--primary);
  animation: hold-wave 0.75s ease-in-out infinite;
}
@keyframes hold-wave {
  0%,
  100% {
    transform: scaleY(0.45);
    opacity: 0.55;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
.hold-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6rpx;
  background: rgba(255, 102, 0, 0.12);
}
.hold-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-dark), var(--primary));
  border-radius: 0 999rpx 999rpx 0;
  transition: width 0.1s linear;
}
</style>

<style>
.input-placeholder {
  color: #9ca3af;
  font-size: 30rpx;
  font-weight: 400;
}
</style>
