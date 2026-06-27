<template>
  <SheetModal :show="show" title="微信登录" :scrollable="false" @close="onClose">
    <MpWechatLoginPanel
      ref="panelRef"
      :loading="loading"
      :event-name="eventName"
      :auto-init="show"
      @authorize="onAuthorize"
      @skip="onClose"
    />
  </SheetModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import SheetModal from './SheetModal.vue'
import MpWechatLoginPanel from './MpWechatLoginPanel.vue'

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  eventName: { type: String, default: '' },
})
const emit = defineEmits(['close', 'authorize'])

const panelRef = ref(null)

watch(
  () => props.show,
  (open) => {
    if (open) panelRef.value?.initPrivacy?.()
  },
)

function onClose() {
  emit('close')
}

function onAuthorize() {
  emit('authorize')
}

function setError(message) {
  panelRef.value?.setError?.(message)
}

defineExpose({ setError })
</script>
