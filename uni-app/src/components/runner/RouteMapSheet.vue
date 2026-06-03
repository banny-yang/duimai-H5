<template>
  <SheetModal :show="show" title="赛道补给地图" @close="$emit('close')">
    <text class="hint">{{ categoryHint }}</text>
    <view v-if="loadError" class="err">{{ loadError }}</view>
    <scroll-view v-if="showSwitcher" scroll-x class="routes">
      <text
        v-for="r in bundle.routes"
        :key="r.id"
        class="route-chip"
        :class="{ active: r.id === activeRouteId }"
        @tap="setRoute(r.id)"
      >
        {{ r.name }}{{ r.distanceKm != null ? ` · ${r.distanceKm}km` : '' }}
      </text>
    </scroll-view>
    <view v-if="activeLine" class="meta">
      <text>当前：{{ activeLine.name }}</text>
      <text v-if="activeLine.distanceKm != null"> · 全程约 {{ activeLine.distanceKm }} km</text>
      <text> · 赛道 {{ pathReady ? '已配置' : '未绘制' }} · 打点 {{ listItems.length }} 个</text>
    </view>
    <RouteMapView
      :line="activeLine"
      :amap-cfg="amapCfg"
      :marker-heat="markerHeat"
      :selected-marker-id="selectedMarkerId"
      :loading="loading"
      :visible="show"
      @select-marker="selectedMarkerId = $event"
    />
    <text class="list-title">补给站 / 打卡点列表（点击可在地图上定位）</text>
    <RouteMapMarkerList
      :line="activeLine"
      :loading="loading"
      :selected-marker-id="selectedMarkerId"
      :marker-heat="markerHeat"
      @select="onListSelect"
    />
    <view class="map-legend">
      <view class="legend-item"><view class="dot dot-start" /><text>起点</text></view>
      <view class="legend-item"><view class="dot dot-finish" /><text>终点</text></view>
      <view class="legend-item"><view class="dot dot-aid" /><text>补给</text></view>
      <view class="legend-item"><view class="dot dot-medical" /><text>医疗</text></view>
      <view class="legend-item"><view class="dot dot-cp" /><text>检查点</text></view>
      <view class="legend-item"><view class="dot dot-warn" /><text>咨询偏多</text></view>
      <view class="legend-item"><view class="dot dot-hot" /><text>热点预警</text></view>
    </view>
  </SheetModal>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import SheetModal from './SheetModal.vue'
import RouteMapView from './RouteMapView.vue'
import RouteMapMarkerList from './RouteMapMarkerList.vue'
import {
  fetchAmapClientConfig,
  fetchEventRouteMapBundle,
  fetchMapPoiHeat,
  fetchProfile,
} from '@/utils/runner-api.js'
import { findLine, resolveLineForCategory, categoryLabel } from '@/utils/route-map.js'
import { buildRouteMapListItems } from '@/utils/route-map-list.js'

const props = defineProps({
  show: Boolean,
  eventGuid: String,
  runnerCategory: String,
})
defineEmits(['close'])

const loading = ref(false)
const loadError = ref(null)
const bundle = ref(null)
const activeRouteId = ref('')
const profileCategory = ref(props.runnerCategory)
const selectedMarkerId = ref(null)
const markerHeat = ref({})
const amapCfg = ref({ enabled: false })
let heatTimer = null

watch(
  () => props.runnerCategory,
  (c) => {
    profileCategory.value = c
  },
)

async function loadHeat() {
  const guid = props.eventGuid
  const routeId = activeRouteId.value
  if (!guid || !routeId) return
  try {
    const rows = await fetchMapPoiHeat(guid, routeId)
    const map = {}
    for (const r of rows) map[r.markerId] = r.heatLevel
    markerHeat.value = map
  } catch {
    markerHeat.value = {}
  }
}

function clearHeatPoll() {
  if (heatTimer) {
    clearInterval(heatTimer)
    heatTimer = null
  }
}

function startHeatPoll() {
  clearHeatPoll()
  loadHeat()
  heatTimer = setInterval(loadHeat, 15000)
}

watch(
  () => [props.show, props.eventGuid],
  async ([open, guid]) => {
    if (!open || !guid) {
      clearHeatPoll()
      return
    }
    loading.value = true
    loadError.value = null
    selectedMarkerId.value = null
    try {
      let category = props.runnerCategory
      if (!category) {
        try {
          const p = await fetchProfile()
          category = p.category
          if (category) profileCategory.value = category
        } catch {
          /* visitor */
        }
      }
      const [cfg, b] = await Promise.all([
        fetchAmapClientConfig().catch(() => ({ enabled: false })),
        fetchEventRouteMapBundle(guid),
      ])
      amapCfg.value = {
        enabled: cfg.enabled,
        apiKey: cfg.apiKey,
        securityJsCode: cfg.securityJsCode,
      }
      bundle.value = b
      const auto = resolveLineForCategory(b, category)
      activeRouteId.value = auto?.id ?? b.defaultRouteId ?? b.routes[0]?.id ?? ''
    } catch (e) {
      bundle.value = null
      loadError.value = e?.message || '加载赛道数据失败'
    } finally {
      loading.value = false
    }
  },
)

watch(
  () => [props.show, props.eventGuid, activeRouteId.value],
  ([open, guid, routeId]) => {
    clearHeatPoll()
    if (!open || !guid || !routeId) return
    startHeatPoll()
  },
)

onUnmounted(clearHeatPoll)

const activeLine = computed(() => {
  if (!bundle.value) return null
  return findLine(bundle.value, activeRouteId.value) ?? bundle.value.routes[0] ?? null
})

const listItems = computed(() => buildRouteMapListItems(activeLine.value))
const showSwitcher = computed(() => (bundle.value?.routes?.length ?? 0) > 1)
const pathReady = computed(() => (activeLine.value?.path?.length ?? 0) >= 2)

const categoryHint = computed(() =>
  profileCategory.value
    ? `已按组别「${categoryLabel(bundle.value?.categories ?? [], profileCategory.value)}」匹配线路，也可手动切换`
    : '选择参赛线路查看赛道路线与补给、打卡点',
)

function setRoute(id) {
  activeRouteId.value = id
  selectedMarkerId.value = null
}

function onListSelect(id) {
  selectedMarkerId.value = id
}
</script>

<style scoped>
.hint {
  font-size: 24rpx;
  color: var(--secondary-text);
  margin-bottom: 16rpx;
  display: block;
  line-height: 1.45;
}
.err {
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 16rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #92400e;
  margin-bottom: 16rpx;
}
.routes {
  white-space: nowrap;
  margin-bottom: 16rpx;
}
.route-chip {
  display: inline-block;
  margin-right: 12rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  border: 1px solid var(--secondary-border);
  border-radius: 999rpx;
  color: var(--secondary-text);
  background: #fff;
}
.route-chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.meta {
  font-size: 22rpx;
  color: var(--secondary-text);
  margin-bottom: 12rpx;
  line-height: 1.5;
}
.list-title {
  font-size: 22rpx;
  color: #94a3b8;
  margin: 24rpx 0 12rpx;
  display: block;
}
.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx 24rpx;
  margin-top: 24rpx;
  font-size: 20rpx;
  color: #94a3b8;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.dot-start {
  background: #10b981;
}
.dot-finish {
  background: #7c3aed;
}
.dot-aid {
  background: var(--primary);
}
.dot-medical {
  background: #ef4444;
}
.dot-cp {
  background: #f59e0b;
}
.dot-warn {
  background: #f97316;
  box-shadow: 0 0 0 2rpx #fdba74;
}
.dot-hot {
  background: #ef4444;
  animation: heat-pulse 1s ease infinite;
}
@keyframes heat-pulse {
  50% {
    opacity: 0.6;
  }
}
</style>
