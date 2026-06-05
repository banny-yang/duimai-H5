<template>
  <view v-if="marqueeText" class="notice-bar" :class="{ emergency: isEmergency }">
    <view class="notice-icon">
      <!-- #ifdef H5 -->
      <svg class="mega-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5zm2.5 1.5a6.5 6.5 0 0 1 0 11 1 1 0 0 0 .2 1.4 1 1 0 0 0 1.4-.2 8.5 8.5 0 0 0 0-13.2 1 1 0 0 0-1.4.2 1 1 0 0 0 .2 1.4z" />
      </svg>
      <!-- #endif -->
      <!-- #ifdef MP-WEIXIN -->
      <text class="iconfont iconfont-glyph mega-icon" :style="iconfontStyle('28rpx')">{{ megaphoneGlyph }}</text>
      <!-- #endif -->
      <!-- #ifndef H5 || MP-WEIXIN -->
      <svg class="mega-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5zm2.5 1.5a6.5 6.5 0 0 1 0 11 1 1 0 0 0 .2 1.4 1 1 0 0 0 1.4-.2 8.5 8.5 0 0 0 0-13.2 1 1 0 0 0-1.4.2 1 1 0 0 0 .2 1.4z" />
      </svg>
      <!-- #endif -->
    </view>
    <view class="notice-marquee-mask">
      <NoticeMarquee
        :text="marqueeText"
        :always-scroll="true"
        :edge-fade-color="fadeColor"
        :text-class="isEmergency ? 'marquee-text-emergency' : 'marquee-text-normal'"
      />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import NoticeMarquee from './NoticeMarquee.vue'
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'

const megaphoneGlyph = getIconGlyph('megaphone')

const props = defineProps({
  event: { type: Object, required: true },
})

const isEmergency = computed(
  () => props.event.emergencyActive && !!props.event.emergencyNotice?.trim(),
)

const rawText = computed(() => {
  if (isEmergency.value) return props.event.emergencyNotice.trim()
  if (props.event.phase === 'race') return props.event.raceNotice
  if (props.event.phase === 'post') return props.event.postNotice
  return props.event.preNotice
})

const marqueeText = computed(() => (rawText.value || '').replace(/\s+/g, ' ').trim())

const fadeColor = computed(() => (isEmergency.value ? '#ffffff' : '#fff4eb'))
</script>

<style scoped>
.notice-marquee-mask {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

</style>
