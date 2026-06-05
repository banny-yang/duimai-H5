<template>
  <SheetModal :show="show" title="我的参赛信息" @close="$emit('close')">
    <text class="sync" :class="{ visible: loading }">正在从服务器同步…</text>
    <view class="hero">
      <text class="label">选手</text>
      <text class="name">{{ data.name }}</text>
      <text class="bib">{{ data.bib }}</text>
    </view>
    <view v-for="(row, i) in displayRows" :key="i" class="row">
      <text class="k">{{ row[0] }}</text>
      <text class="v">{{ row[1] }}</text>
    </view>
  </SheetModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from './SheetModal.vue'
import { fetchProfile, mergeProfile } from '@/utils/runner-api.js'

const props = defineProps({
  show: Boolean,
  runner: Object,
  apiConnected: Boolean,
})
const emit = defineEmits(['close', 'update'])

const data = ref({ ...(props.runner || {}) })
const loading = ref(false)
let wasOpen = false

watch(
  () => [props.show, props.runner],
  async ([open, runner]) => {
    if (!open) {
      wasOpen = false
      loading.value = false
      return
    }
    data.value = { ...runner }
    const justOpened = !wasOpen
    wasOpen = true
    if (!props.apiConnected || !justOpened) return
    loading.value = true
    try {
      const p = await fetchProfile()
      const merged = mergeProfile(runner, p)
      data.value = merged
      emit('update', merged)
    } catch {
      /* ignore */
    } finally {
      loading.value = false
    }
  },
  { deep: true },
)

const displayRows = computed(() => {
  const d = data.value
  return [
    ['参赛号', d.bib],
    ['分区', d.zone],
    ['领物窗口', d.pickupWindow],
    ['检录截止', `${d.zone} ${d.checkInBefore} 前`],
    ['血型', d.bloodType],
    ['紧急联系人', d.emergencyContact],
    ['联系电话', d.emergencyPhone],
  ]
})
</script>

<style scoped>
.sync {
  font-size: 22rpx;
  color: #64748b;
  min-height: 36rpx;
  visibility: hidden;
  margin-bottom: 8rpx;
}
.sync.visible {
  visibility: visible;
}
.hero {
  background: var(--primary-surface);
  border: 1px solid var(--primary-border, rgba(37, 99, 235, 0.2));
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.label {
  font-size: 22rpx;
  color: #64748b;
}
.name {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--primary-deeper, #1e40af);
  display: block;
}
.bib {
  font-size: 56rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  display: block;
  margin-top: 8rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 28rpx;
}
.k {
  color: #64748b;
}
.v {
  font-weight: 600;
  max-width: 60%;
  text-align: right;
}
</style>
