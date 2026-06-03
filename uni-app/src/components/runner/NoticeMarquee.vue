<template>
  <view class="notice-marquee-viewport">
    <view
      v-if="scrolling"
      class="marquee-fade marquee-fade-left"
      :style="fadeLeftStyle"
    />
    <view
      v-if="scrolling"
      class="marquee-fade marquee-fade-right"
      :style="fadeRightStyle"
    />
    <view
      v-if="scrolling"
      class="notice-marquee-track notice-marquee-track--scroll"
      :style="trackAnimStyle"
    >
      <view class="marquee-segment-wrap">
        <text class="marquee-segment" :class="textClass">{{ displayText }}</text>
      </view>
      <view class="marquee-segment-wrap" aria-hidden="true">
        <text class="marquee-segment" :class="textClass">{{ displayText }}</text>
      </view>
    </view>
    <view v-else class="notice-marquee-track notice-marquee-track--static">
      <text class="marquee-segment marquee-segment--ellipsis" :class="textClass">
        {{ displayText }}
      </text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  /** 公告条：始终跑马灯 */
  alwaysScroll: { type: Boolean, default: true },
  edgeFadeColor: { type: String, default: '#fff4eb' },
  textClass: { type: String, default: '' },
})

const displayText = computed(() => props.text.replace(/\s+/g, ' ').trim())

/** 无 alwaysScroll 且极短文案可不滚动；公告默认 alwaysScroll */
const scrolling = computed(() => {
  if (!displayText.value) return false
  if (props.alwaysScroll) return true
  return displayText.value.length > 18
})

/** 按字数估算时长，约 48px/s 体感 */
const animDurationSec = computed(() => {
  const len = displayText.value.length || 1
  return Math.max(8, Math.min(40, len * 0.22))
})

const trackAnimStyle = computed(() => ({
  animationDuration: `${animDurationSec.value}s`,
}))

const fadeLeftStyle = computed(() => ({
  background: `linear-gradient(to right, ${props.edgeFadeColor}, transparent)`,
}))
const fadeRightStyle = computed(() => ({
  background: `linear-gradient(to left, ${props.edgeFadeColor}, transparent)`,
}))
</script>

<style scoped>
.notice-marquee-viewport {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 36rpx;
  min-height: 36rpx;
  overflow: hidden;
}
/* #ifdef H5 */
.notice-marquee-viewport {
  height: 20px;
  min-height: 20px;
}
/* #endif */
.marquee-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32rpx;
  z-index: 2;
  pointer-events: none;
}
.marquee-fade-left {
  left: 0;
}
.marquee-fade-right {
  right: 0;
}
.notice-marquee-track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  height: 100%;
}
.notice-marquee-track--scroll {
  width: max-content;
  animation: notice-marquee-run linear infinite;
  will-change: transform;
}
.marquee-segment-wrap {
  flex-shrink: 0;
  padding-right: 32rpx;
}
.notice-marquee-track--static {
  width: 100%;
}
.marquee-segment {
  white-space: nowrap;
}
.marquee-segment--ellipsis {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
@keyframes notice-marquee-run {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
