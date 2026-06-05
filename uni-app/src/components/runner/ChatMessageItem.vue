<template>
  <GreetingMessage
    v-if="message.id === 'greet'"
    :runner="runner"
    :greeting="greeting"
  />
  <view v-else-if="message.role === 'user' && message.text" class="chat-row-user">
    <view class="user-bubble">
      <text class="user-text">{{ message.text }}</text>
    </view>
    <UserAvatar />
  </view>
  <view v-else-if="message.role === 'staff'" class="chat-row-assistant">
    <view class="staff-bubble">
      <rich-text v-if="message.text" class="md-content" :nodes="mdToNodes(message.text)" />
      <text v-else>{{ message.text }}</text>
    </view>
  </view>
  <view v-else-if="message.role === 'assistant'" class="chat-row-assistant">
    <view class="assistant-col">
      <view v-if="message.streaming" class="assistant-label">
        <AiAvatar />
        <text class="label-text">对麦智能</text>
      </view>
      <view class="ai-bubble">
        <rich-text v-if="message.text" class="md-content" :nodes="mdToNodes(message.text)" />
        <text v-else>{{ message.text }}</text>
        <text v-if="message.streaming" class="cursor">|</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import GreetingMessage from './GreetingMessage.vue'
import AiAvatar from './AiAvatar.vue'
import UserAvatar from './UserAvatar.vue'
import { parseMarkdown } from '@/utils/markdown-parser.js'

defineProps({
  message: Object,
  runner: Object,
  greeting: String,
})

/**
 * 将 Markdown 文本转为 rich-text 组件可用的 HTML 字符串
 * @param {string} text - 原始 Markdown 文本
 * @returns {string} HTML 字符串
 */
function mdToNodes(text) {
  if (!text || typeof text !== 'string') return ''
  return parseMarkdown(text)
}
</script>

<style scoped>
.user-text {
  text-align: right;
}
.assistant-col {
  max-width: 88%;
}
.assistant-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: var(--secondary-text);
}
.cursor {
  color: var(--primary);
  margin-left: 4rpx;
}
</style>
