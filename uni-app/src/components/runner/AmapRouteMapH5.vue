<template>
  <view class="map-wrap">
    <!-- 必须原生 div，且始终挂载，高德才能找到容器 -->
    <div ref="mapElRef" class="map-canvas" />
    <view v-if="showLoading" class="placeholder">
      <text>加载地图…</text>
    </view>
    <view v-else-if="errorText" class="placeholder">
      <text>{{ errorText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { loadAmapMap, formatAmapLoadError } from '@/utils/amap-loader.js'
import { markerLabelHtml } from '@/utils/route-map-markers.js'

const props = defineProps({
  line: Object,
  amapCfg: Object,
  markerHeat: { type: Object, default: () => ({}) },
  selectedMarkerId: String,
  loading: Boolean,
  visible: Boolean,
})
const emit = defineEmits(['select-marker'])

const mapElRef = ref(null)
const errorText = ref(null)
const mapReady = ref(false)

const showLoading = computed(() => {
  if (props.loading) return true
  if (errorText.value || !canShowMap()) return false
  return !mapReady.value
})

let mapInstance = null
let overlayMap = new Map()
let lastFitKey = ''
let selectedIdRef = null
let renderToken = 0

function canShowMap() {
  const cfg = props.amapCfg
  const line = props.line
  const key = cfg?.apiKey?.trim()
  return (
    key &&
    cfg?.enabled !== false &&
    line &&
    ((line.path?.length ?? 0) >= 2 || (line.markers?.length ?? 0) > 0)
  )
}

function geometryKey(line) {
  if (!line) return ''
  return `${line.id}:${line.path?.length ?? 0}:${(line.markers ?? []).map((m) => m.id).join(',')}`
}

function applyMarkerStyles(selId, heat) {
  overlayMap.forEach((entry, id) => {
    const selected = id === selId
    entry.overlay.setzIndex(selected ? 200 : 100)
    entry.overlay.setLabel({
      content: markerLabelHtml(entry.data, selected, heat[id]),
      direction: 'top',
    })
  })
}

/** 等待弹窗内 div 完成布局（避免 Map container div not exist） */
async function waitForMapEl(token) {
  for (let i = 0; i < 30; i++) {
    await nextTick()
    if (token !== renderToken) return null
    const el = mapElRef.value
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
      return el
    }
    await new Promise((r) => setTimeout(r, 50))
  }
  return mapElRef.value || null
}

async function renderMap() {
  const token = ++renderToken

  if (props.visible === false) return
  if (props.loading) {
    mapReady.value = false
    return
  }

  if (!canShowMap()) {
    mapReady.value = false
    errorText.value =
      props.line &&
      (props.line.path?.length ?? 0) < 2 &&
      !(props.line.markers?.length)
        ? '暂无该线路 GIS 数据，请联系赛事运营配置赛道'
        : '高德地图未配置或暂无线路数据'
    return
  }

  errorText.value = null
  mapReady.value = false
  const line = props.line
  selectedIdRef = props.selectedMarkerId ?? null

  try {
    const el = await waitForMapEl(token)
    if (!el || token !== renderToken) {
      errorText.value = '地图容器未就绪，请关闭弹窗后重试'
      return
    }

    const AMap = await loadAmapMap(props.amapCfg)
    if (token !== renderToken) return

    const el2 = mapElRef.value
    if (!el2 || !document.body.contains(el2)) {
      errorText.value = '地图容器未就绪，请关闭弹窗后重试'
      return
    }

    if (mapInstance) {
      try {
        mapInstance.destroy()
      } catch {
        /* ignore */
      }
      mapInstance = null
      overlayMap.clear()
    }

    const center =
      line.center ??
      line.path?.[0] ?? [line.markers?.[0]?.lng ?? 104.06, line.markers?.[0]?.lat ?? 30.57]

    const map = new AMap.Map(el2, {
      zoom: line.zoom ?? 13,
      center,
      viewMode: '2D',
    })
    map.addControl(new AMap.Scale())
    mapInstance = map

    const overlays = []
    if ((line.path?.length ?? 0) >= 2) {
      const pl = new AMap.Polyline({
        path: line.path.map(([lng, lat]) => [lng, lat]),
        strokeColor: '#0891b2',
        strokeWeight: 5,
        lineJoin: 'round',
      })
      map.add(pl)
      overlays.push(pl)
    }

    for (const m of line.markers ?? []) {
      const selected = m.id === selectedIdRef
      const marker = new AMap.Marker({
        position: [m.lng, m.lat],
        title: m.label,
        zIndex: selected ? 200 : 100,
        label: {
          content: markerLabelHtml(m, selected, props.markerHeat[m.id]),
          direction: 'top',
        },
        cursor: 'pointer',
      })
      marker.on('click', () => {
        selectedIdRef = selectedIdRef === m.id ? null : m.id
        applyMarkerStyles(selectedIdRef, props.markerHeat)
        emit('select-marker', selectedIdRef)
        if (selectedIdRef) map.setCenter([m.lng, m.lat])
      })
      map.add(marker)
      overlays.push(marker)
      overlayMap.set(m.id, { overlay: marker, data: m })
    }

    const fitKey = geometryKey(line)
    if (fitKey !== lastFitKey && overlays.length) {
      lastFitKey = fitKey
      map.setFitView(overlays, false, [24, 24, 24, 24])
    }

    mapReady.value = true
    const resize = () => {
      try {
        map.resize()
      } catch {
        /* ignore */
      }
    }
    resize()
    setTimeout(resize, 200)
    setTimeout(resize, 600)
  } catch (e) {
    if (token !== renderToken) return
    mapReady.value = false
    errorText.value = formatAmapLoadError(e)
  }
}

watch(
  () => [props.line, props.amapCfg, props.markerHeat, props.loading, props.visible],
  () => {
    if (props.visible === false) return
    renderMap()
  },
  { deep: true },
)

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    setTimeout(() => renderMap(), 200)
    setTimeout(() => {
      try {
        mapInstance?.resize()
      } catch {
        /* ignore */
      }
    }, 700)
  },
)

watch(
  () => props.selectedMarkerId,
  (id) => {
    selectedIdRef = id ?? null
    if (!mapInstance || !mapReady.value) return
    applyMarkerStyles(selectedIdRef, props.markerHeat)
    if (selectedIdRef && props.line) {
      const m = (props.line.markers ?? []).find((x) => x.id === selectedIdRef)
      if (m) mapInstance.setCenter([m.lng, m.lat])
    }
  },
)

onMounted(() => {
  setTimeout(() => renderMap(), 200)
})

onBeforeUnmount(() => {
  renderToken++
  if (mapInstance) {
    try {
      mapInstance.destroy()
    } catch {
      /* ignore */
    }
    mapInstance = null
  }
  overlayMap.clear()
  lastFitKey = ''
  mapReady.value = false
})
</script>

<style scoped>
.map-wrap {
  width: 100%;
  height: 280px;
  min-height: 280px;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  position: relative;
}
.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 280px;
  display: block;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  font-size: 14px;
  color: #64748b;
  background: #f1f5f9;
  z-index: 2;
  pointer-events: none;
}
</style>
