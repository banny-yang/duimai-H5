<template>
  <view class="h5-root connection-page">
    <text class="connection-title">{{ heading }}</text>
    <text class="connection-msg">{{ message }}</text>
    <text v-if="eventGuid" class="connection-guid">{{ eventGuid }}</text>
    <button class="btn-primary" @tap="$emit('retry')">重试</button>
    <text class="connection-hint">{{ hint }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  message: { type: String, required: true },
  eventGuid: String,
})
defineEmits(['retry'])

const heading = computed(() => {
  if (props.title) return props.title
  if (/审核|尚未发布|暂不可用/.test(props.message)) return '赛事尚未开放'
  if (/不存在|无效/.test(props.message)) return '赛事不存在'
  return '无法加载赛事'
})

const hint = computed(() =>
  /审核|尚未发布|暂不可用/.test(props.message)
    ? '请在运营平台审核通过并上线赛事后，选手端方可访问'
    : '请确认选手端服务（8091）已启动，且 API 地址配置正确',
)
</script>
