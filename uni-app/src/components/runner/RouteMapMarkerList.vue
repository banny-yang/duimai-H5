<template>
  <view v-if="loading" class="marker-list-empty">加载补给站列表…</view>
  <view v-else-if="!line" class="marker-list-empty">请选择线路</view>
  <view v-else-if="items.length === 0" class="marker-list-empty">
    「{{ line.name }}」暂无补给/打卡点
  </view>
  <view v-else class="marker-list">
    <view
      v-for="p in items"
      :key="p.id"
      class="marker-row"
      :class="{
        selected: p.id === selectedMarkerId,
        'heat-warning': heatOf(p.id) === 'warning',
        'heat-critical': heatOf(p.id) === 'critical',
      }"
    >
      <view class="marker-main" @tap="toggleSelect(p.id)">
        <text class="type-tag" :class="'type-' + p.type">{{ p.typeLabel }}</text>
        <text class="marker-label">{{ p.label }}</text>
        <text class="marker-km">{{ p.kmText }}</text>
      </view>
      <text v-if="markerOf(p.id)" class="nav-btn" @tap.stop="openNav(p)">导航</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { buildRouteMapListItems } from '@/utils/route-map-list.js'
import { amapNavigationUrl } from '@/utils/route-map-markers.js'

const props = defineProps({
  line: Object,
  loading: Boolean,
  selectedMarkerId: String,
  markerHeat: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['select'])

const items = computed(() => buildRouteMapListItems(props.line))

function heatOf(id) {
  return props.markerHeat?.[id] ?? 'normal'
}

function markerOf(itemId) {
  return props.line?.markers?.find((m) => m.id === itemId)
}

function toggleSelect(id) {
  emit('select', props.selectedMarkerId === id ? null : id)
}

function openNav(item) {
  const m = markerOf(item.id)
  if (!m) return
  // #ifdef H5
  if (typeof window !== 'undefined') {
    window.open(amapNavigationUrl(m.lng, m.lat, m.label || item.label), '_blank')
    return
  }
  // #endif
  uni.openLocation({
    latitude: m.lat,
    longitude: m.lng,
    name: m.label || item.label,
    scale: 16,
  })
}
</script>

<style scoped>
.marker-list-empty {
  text-align: center;
  font-size: 24rpx;
  color: var(--secondary-text);
  padding: 32rpx 0;
}
.marker-list {
  max-height: 360rpx;
  overflow-y: auto;
}
.marker-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--secondary-border);
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}
.marker-row.selected {
  border-color: var(--primary);
}
.marker-row.heat-warning {
  box-shadow: 0 0 0 2rpx #fb923c;
}
.marker-row.heat-critical {
  box-shadow: 0 0 0 2rpx #ef4444;
  animation: heat-pulse 1s ease infinite;
}
@keyframes heat-pulse {
  50% {
    opacity: 0.85;
  }
}
.marker-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  min-width: 0;
}
.marker-row.selected .marker-main {
  background: var(--primary-surface);
}
.type-tag {
  flex-shrink: 0;
  font-size: 20rpx;
  font-weight: 700;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
}
.type-start {
  background: #d1fae5;
  color: #047857;
}
.type-finish {
  background: #ede9fe;
  color: #6d28d9;
}
.type-aid {
  background: rgba(255, 102, 0, 0.12);
  color: var(--primary-dark);
}
.type-medical {
  background: #fee2e2;
  color: #b91c1c;
}
.type-cp {
  background: #fef3c7;
  color: #b45309;
}
.type-other {
  background: #f1f5f9;
  color: #475569;
}
.marker-label {
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.marker-km {
  flex-shrink: 0;
  font-size: 24rpx;
  color: var(--secondary-text);
}
.nav-btn {
  flex-shrink: 0;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  font-size: 20rpx;
  font-weight: 700;
  color: var(--primary-dark);
  border-left: 1px solid var(--secondary-border);
  background: #f8fafc;
}
</style>
