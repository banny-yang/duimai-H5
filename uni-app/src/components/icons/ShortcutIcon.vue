<template>
  <!-- #ifdef H5 -->
  <svg class="shortcut-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      v-if="type === 'info'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 8h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zm0 0V6a2 2 0 0 1 2-2h1m15 4V6a2 2 0 0 0-2-2h-1M9 12h6"
    />
    <template v-else-if="type === 'map'">
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 3v15M15 6v15" />
    </template>
    <template v-else>
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M6 6h12a2 2 0 0 1 2 2v8H4V8a2 2 0 0 1 2-2zm-2 10h16v2H4v-2z" />
      <circle fill="none" stroke="currentColor" stroke-width="1.75" cx="8" cy="18" r="1.5" />
      <circle fill="none" stroke="currentColor" stroke-width="1.75" cx="16" cy="18" r="1.5" />
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M8 6V4h8v2" />
    </template>
  </svg>
  <!-- #endif -->
  <!-- #ifdef MP-WEIXIN -->
  <text class="iconfont iconfont-glyph" :style="iconfontStyle('40rpx')">{{ shortcutGlyph }}</text>
  <!-- #endif -->
  <!-- #ifndef H5 || MP-WEIXIN -->
  <svg class="shortcut-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      v-if="type === 'info'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 8h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zm0 0V6a2 2 0 0 1 2-2h1m15 4V6a2 2 0 0 0-2-2h-1M9 12h6"
    />
    <template v-else-if="type === 'map'">
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 3v15M15 6v15" />
    </template>
    <template v-else>
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M6 6h12a2 2 0 0 1 2 2v8H4V8a2 2 0 0 1 2-2zm-2 10h16v2H4v-2z" />
      <circle fill="none" stroke="currentColor" stroke-width="1.75" cx="8" cy="18" r="1.5" />
      <circle fill="none" stroke="currentColor" stroke-width="1.75" cx="16" cy="18" r="1.5" />
      <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M8 6V4h8v2" />
    </template>
  </svg>
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'
import { getIconGlyph, iconfontStyle } from '@/utils/iconfont-text.js'

const props = defineProps({
  type: { type: String, required: true },
})

const shortcutGlyph = computed(() => {
  if (props.type === 'info') return getIconGlyph('info')
  if (props.type === 'map') return getIconGlyph('map')
  return getIconGlyph('shuttle')
})
</script>

<style scoped>
.shortcut-svg {
  width: 40rpx;
  height: 40rpx;
}
</style>
