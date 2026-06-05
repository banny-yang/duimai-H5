<template>
  <SheetModal :show="show" :title="doc?.title || '加载中…'" @close="$emit('close')">
    <text v-if="doc?.version" class="ver">版本 {{ doc.version }}</text>
    <text class="content">{{ doc?.content || '' }}</text>
  </SheetModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import SheetModal from './SheetModal.vue'
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
.ver {
  font-size: 22rpx;
  color: var(--secondary-text, #64748b);
  margin-bottom: 16rpx;
  display: block;
}
.content {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
