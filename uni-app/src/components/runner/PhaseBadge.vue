<template>
  <view class="phase-badge">
    <view class="phase-dot" />
    <text>{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { phaseLabel } from '@/utils/event-phase.js'

const props = defineProps({
  phase: { type: String, default: 'pre' },
})

const label = computed(() => phaseLabel(props.phase))
</script>
