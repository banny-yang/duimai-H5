<template>
  <SheetModal :show="show" :title="title" @close="$emit('close')">
    <view v-if="loading" class="center">加载领物须知…</view>
    <view v-else-if="!visible" class="center muted">
      组委会暂未发布领物指引，请留意赛事官方通知或咨询现场工作人员。
    </view>
    <template v-else>
      <view class="hero">
        <text class="name">{{ runner.name }}</text>
        <text class="bib">{{ runner.bib }}</text>
        <text v-if="guide.location" class="meta">{{ guide.location }}</text>
        <text v-if="guide.hours" class="hours">{{ guide.hours }}</text>
        <text v-if="runner.pickupWindow" class="meta">领物窗口：{{ runner.pickupWindow }}</text>
      </view>
      <view v-for="(item, i) in guide.items" :key="i" class="item">· {{ item }}</view>
      <text v-if="guide.mapHint" class="hint">{{ guide.mapHint }}</text>
      <button v-if="showMapBtn" class="map-btn" @tap="openMap">查看领物点位置（赛道地图）</button>
    </template>
  </SheetModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from './SheetModal.vue'
import { fetchEventShuttleConfig } from '@/utils/runner-api.js'
import { isPickupVisible } from '@/utils/shuttle.js'

const props = defineProps({
  show: Boolean,
  eventGuid: String,
  runner: Object,
})
const emit = defineEmits(['close', 'view-map'])

const loading = ref(false)
const config = ref(null)

watch(
  () => [props.show, props.eventGuid],
  async ([open, guid]) => {
    if (!open || !guid) return
    loading.value = true
    try {
      config.value = await fetchEventShuttleConfig(guid)
    } catch {
      config.value = null
    } finally {
      loading.value = false
    }
  },
)

const guide = computed(
  () =>
    config.value?.pickup ?? {
      title: '领物须知',
      location: '',
      hours: '',
      items: [],
      mapHint: '',
    },
)
const title = computed(() => guide.value.title || '领物须知')
const visible = computed(() => isPickupVisible(config.value))
const showMapBtn = computed(() => visible.value)

function openMap() {
  emit('close')
  emit('view-map')
}
</script>

<style scoped>
.center {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #94a3b8;
}
.muted {
  color: #64748b;
  line-height: 1.5;
  padding: 0 16rpx;
}
.hero {
  background: var(--primary-surface);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.name {
  font-size: 28rpx;
  font-weight: 700;
}
.bib {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--primary-deeper, #1e40af);
  display: block;
}
.meta,
.hours {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 8rpx;
  display: block;
}
.hours {
  color: var(--primary-dark, #1d4ed8);
  font-weight: 600;
}
.item {
  font-size: 28rpx;
  line-height: 1.5;
  margin-bottom: 16rpx;
  color: #334155;
}
.hint {
  font-size: 24rpx;
  color: #64748b;
  margin-bottom: 24rpx;
  display: block;
}
.map-btn {
  width: 100%;
  background: var(--primary);
  color: #fff;
  border-radius: 16rpx;
  font-weight: 700;
}
</style>
