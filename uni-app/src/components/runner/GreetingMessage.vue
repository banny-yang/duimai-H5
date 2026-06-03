<template>
  <view class="chat-row-assistant">
    <view class="assistant-col">
      <view class="assistant-label">
        <AiAvatar />
        <text class="label-text">对麦智能</text>
      </view>
      <view class="ai-bubble">
        <text v-if="greeting" class="bubble-text">{{ greeting }}</text>
        <text v-else-if="hasProfile" class="bubble-text">
          Hi <text class="text-primary-dark">{{ runner.name }}</text>，你是
          <text class="text-primary">{{ runner.zone }} {{ bibNum }} 号</text>
          选手，请于 <text class="text-primary">{{ runner.checkInBefore }}</text> 前到达
          <text class="text-primary-dark">{{ runner.zone }}</text> 检录。
        </text>
        <text v-else class="bubble-text">
          你好，我是 <text class="text-primary-dark">对麦赛事助手</text>。完赛后可问我领物、补给、交通等问题；验证参赛身份后可查看个人参赛信息。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import AiAvatar from './AiAvatar.vue'

const props = defineProps({
  runner: Object,
  greeting: String,
})

const hasProfile = computed(
  () => Boolean(props.runner?.name?.trim() && props.runner?.bib?.trim()),
)
const bibNum = computed(() => props.runner?.bib?.replace(/^[A-Z]/i, '') ?? '')
</script>

<style scoped>
.assistant-col {
  max-width: 88%;
}
.assistant-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
  color: var(--secondary-text);
}
.label-text {
  font-size: 22rpx;
}
.bubble-text {
  font-size: 30rpx;
  line-height: 1.5;
}
</style>
