<template>
  <view class="sos-float-wrap">
    <text v-if="!disabled && progress > 0 && progress < 1" class="sos-hold-hint">
      继续按住 {{ holdLeft }}s
    </text>
    <view class="sos-ring" :class="{ holding: progress > 0 && !disabled }" :style="ringStyle">
      <view
        class="sos-sphere"
        :class="{ disabled }"
        @touchstart.stop="onStart"
        @touchend.stop="onEnd"
        @touchcancel.stop="onEnd"
        @tap="onTap"
      >
        SOS
      </view>
    </view>
    <text class="sos-float-hint">{{ disabled ? '需身份验证' : '长按3秒' }}</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const HOLD_MS = 3000

const props = defineProps({
  disabled: Boolean,
})
const emit = defineEmits(['triggered', 'disabled-tap'])

const progress = ref(0)
let timer = null
let startAt = 0

const holdLeft = computed(() => Math.ceil((1 - progress.value) * 3))

const ringStyle = computed(() => {
  if (props.disabled || progress.value <= 0) return {}
  return {
    background: `conic-gradient(#fff ${progress.value * 360}deg, transparent 0)`,
    padding: '6rpx',
    borderRadius: '50%',
  }
})

function clear() {
  if (timer) clearInterval(timer)
  timer = null
  progress.value = 0
}

function onStart() {
  if (props.disabled) return
  clear()
  startAt = Date.now()
  timer = setInterval(() => {
    const p = Math.min(1, (Date.now() - startAt) / HOLD_MS)
    progress.value = p
    if (p >= 1) {
      clear()
      emit('triggered')
    }
  }, 50)
}

function onEnd() {
  clear()
}

function onTap() {
  if (props.disabled) emit('disabled-tap')
}
</script>

<style scoped>
.sos-sphere.disabled {
  background: #e2e8f0 !important;
  color: #94a3b8 !important;
  box-shadow: none !important;
}
.sos-hold-hint {
  font-size: 20rpx;
  color: #dc2626;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  margin-bottom: 8rpx;
}
.sos-ring {
  border-radius: 50%;
}

/* #ifdef MP-WEIXIN */
:deep(.sos-float-wrap),
.sos-float-wrap {
  position: fixed;
  right: 20rpx;
  bottom: var(--mp-sos-bottom, calc(120rpx + env(safe-area-inset-bottom)));
  top: auto !important;
  transform: none !important;
  z-index: 100;
}
/* #endif */
</style>
