<template>
  <view class="mic-icon" aria-hidden="true">
    <!-- #ifdef H5 -->
    <svg class="mic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
        stroke-linecap="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke-linecap="round" />
    </svg>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <text class="iconfont iconfont-glyph" :style="iconfontStyle('44rpx')">{{ micGlyph }}</text>
    <!-- #endif -->
    <!-- #ifndef H5 || MP-WEIXIN -->
    <svg class="mic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z"
        stroke-linecap="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke-linecap="round" />
    </svg>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'

const micGlyph = getIconGlyph('mic')
</script>

<style scoped>
.mic-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.mic-svg {
  width: 40rpx;
  height: 40rpx;
}
</style>
