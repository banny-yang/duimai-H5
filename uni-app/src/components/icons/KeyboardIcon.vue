<template>
  <view class="keyboard-icon" aria-hidden="true">
    <!-- #ifdef H5 -->
    <svg class="keyboard-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke-linejoin="round" />
      <path d="M7 10h2M11 10h2M15 10h2M7 14h4M13 14h4" stroke-linecap="round" />
    </svg>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <text class="iconfont iconfont-glyph" :style="iconfontStyle('44rpx')">{{ keyboardGlyph }}</text>
    <!-- #endif -->
    <!-- #ifndef H5 || MP-WEIXIN -->
    <svg class="keyboard-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke-linejoin="round" />
      <path d="M7 10h2M11 10h2M15 10h2M7 14h4M13 14h4" stroke-linecap="round" />
    </svg>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'

const keyboardGlyph = getIconGlyph('keyboard')
</script>

<style scoped>
.keyboard-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.keyboard-svg {
  width: 40rpx;
  height: 40rpx;
}
</style>
