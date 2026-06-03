<template>
  <view class="map-wrap">
    <map
      v-if="mapReady"
      class="map"
      :latitude="center.lat"
      :longitude="center.lng"
      :scale="scale"
      :polyline="polyline"
      :markers="markers"
      show-location
      @markertap="onMarkerTap"
    />
    <view v-else class="placeholder">
      <text>{{ placeholderText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { markerIconPath } from '@/utils/route-map-markers.js'

const props = defineProps({
  line: Object,
  markerHeat: { type: Object, default: () => ({}) },
  selectedMarkerId: String,
  loading: Boolean,
})
const emit = defineEmits(['select-marker'])

const mapReady = computed(() => {
  const line = props.line
  return (
    line &&
    (line.path?.length >= 2 || line.markers?.length > 0) &&
    center.value.lat &&
    center.value.lng
  )
})

const center = computed(() => {
  const line = props.line
  if (!line) return { lat: 39.9, lng: 116.4 }
  if (line.center?.length === 2) {
    return { lat: line.center[1], lng: line.center[0] }
  }
  const m = line.markers?.[0]
  if (m) return { lat: m.lat, lng: m.lng }
  const p = line.path?.[0]
  if (p) return { lat: p[1], lng: p[0] }
  return { lat: 39.9, lng: 116.4 }
})

const scale = computed(() => {
  const z = props.line?.zoom
  if (z != null) return Math.min(18, Math.max(3, Math.round(z)))
  return 13
})

const polyline = computed(() => {
  const path = props.line?.path ?? []
  if (path.length < 2) return []
  return [
    {
      points: path.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      color: '#0891b2',
      width: 4,
      arrowLine: true,
    },
  ]
})

const markers = computed(() =>
  (props.line?.markers ?? []).map((m, idx) => {
    const heat = props.markerHeat[m.id]
    return {
      id: idx + 1,
      markerId: m.id,
      latitude: m.lat,
      longitude: m.lng,
      title: m.label,
      width: 28,
      height: 28,
      callout: {
        content: m.label,
        display: props.selectedMarkerId === m.id ? 'ALWAYS' : 'BYCLICK',
      },
      label: {
        content: m.label?.slice(0, 4) || '点',
        color: '#fff',
        bgColor: markerIconPath(m.type, heat),
        padding: 4,
        borderRadius: 4,
      },
    }
  }),
)

const placeholderText = computed(() => {
  if (props.loading) return '加载地图…'
  return '暂无赛道线路数据'
})

function onMarkerTap(e) {
  const idx = e.detail?.markerId ?? e.markerId
  const m = props.line?.markers?.[(idx ?? 1) - 1]
  if (m?.id) emit('select-marker', m.id)
}
</script>

<style scoped>
.map-wrap {
  width: 100%;
  height: 280px;
  min-height: 280px;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
}
.map {
  width: 100%;
  height: 280px;
}
.placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 26rpx;
}
</style>
