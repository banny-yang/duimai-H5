<template>
  <!-- #ifdef H5 -->
  <AmapRouteMapH5
    v-if="useAmapH5"
    :line="line"
    :amap-cfg="amapCfg"
    :marker-heat="markerHeat"
    :selected-marker-id="selectedMarkerId"
    :loading="loading"
    :visible="visible"
    @select-marker="$emit('select-marker', $event)"
  />
  <NativeRouteMapView
    v-else
    :line="line"
    :marker-heat="markerHeat"
    :selected-marker-id="selectedMarkerId"
    :loading="loading"
    :visible="visible"
    @select-marker="$emit('select-marker', $event)"
  />
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <NativeRouteMapView
    :line="line"
    :marker-heat="markerHeat"
    :selected-marker-id="selectedMarkerId"
    :loading="loading"
    @select-marker="$emit('select-marker', $event)"
  />
  <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue'
// #ifdef H5
import AmapRouteMapH5 from './AmapRouteMapH5.vue'
// #endif
import NativeRouteMapView from './NativeRouteMapView.vue'

const props = defineProps({
  line: Object,
  amapCfg: Object,
  markerHeat: { type: Object, default: () => ({}) },
  selectedMarkerId: String,
  loading: Boolean,
  visible: Boolean,
})
defineEmits(['select-marker'])

/** H5：有 apiKey 且未显式关闭时用高德 JS（弹窗内 web-view 易空白） */
const useAmapH5 = computed(() => {
  const cfg = props.amapCfg
  const line = props.line
  const key = cfg?.apiKey?.trim()
  if (!key || cfg?.enabled === false || !line) return false
  return (line.path?.length ?? 0) >= 2 || (line.markers?.length ?? 0) > 0
})
</script>
