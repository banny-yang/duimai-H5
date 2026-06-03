<template>
  <view v-if="show" class="full">
    <view class="header">
      <view class="titles">
        <text class="title">{{ doc?.title || '加载中…' }}</text>
        <text v-if="doc?.version" class="ver">版本 {{ doc.version }}</text>
      </view>
      <text class="close" @tap="$emit('close')">关闭</text>
    </view>
    <scroll-view class="body" scroll-y>
      <text class="content">{{ doc?.content || '' }}</text>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchLegalDoc } from '@/utils/runner-api.js'

const props = defineProps({
  show: Boolean,
  type: { type: String, default: 'privacy' },
})
defineEmits(['close'])

const doc = ref(null)

watch(
  () => [props.show, props.type],
  async ([open, type]) => {
    if (!open) return
    doc.value = null
    try {
      doc.value = await fetchLegalDoc(type)
    } catch {
      doc.value = {
        title: type === 'privacy' ? '隐私政策' : '用户协议',
        version: '',
        content: '加载失败，请稍后重试。',
      }
    }
  },
)
</script>

<style scoped>
.full {
  position: fixed;
  inset: 0;
  z-index: 400;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
.header {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid #e2e8f0;
}
.title {
  font-size: 32rpx;
  font-weight: 700;
}
.ver {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
  display: block;
}
.close {
  color: var(--primary);
  font-size: 28rpx;
}
.body {
  flex: 1;
  padding: 32rpx;
}
.content {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
