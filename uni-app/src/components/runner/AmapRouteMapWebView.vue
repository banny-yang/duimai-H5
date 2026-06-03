<template>
  <view class="map-wrap">
    <!-- #ifdef H5 -->
    <web-view
      v-if="webviewSrc"
      ref="webviewRef"
      class="webview"
      :src="webviewSrc"
      @message="onWebViewMessage"
    />
    <view v-if="error" class="placeholder">
      <text>{{ error }}</text>
    </view>
    <!-- #endif -->
    <!-- #ifndef H5 -->
    <view class="placeholder">
      <text>高德 web-view 仅用于 H5</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  line: Object,
  amapCfg: Object,
  markerHeat: { type: Object, default: () => ({}) },
  selectedMarkerId: String,
  loading: Boolean,
})
const emit = defineEmits(['select-marker'])

const webviewRef = ref(null)
const error = ref(null)
const bridgeReady = ref(false)

const webviewSrc = computed(() => {
  // #ifdef H5
  if (typeof window === 'undefined') return '/static/hybrid/amap-route-map.html'
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return `${window.location.origin}${base}static/hybrid/amap-route-map.html`
  // #endif
  return ''
})

function canShowAmap() {
  const cfg = props.amapCfg
  const line = props.line
  return (
    cfg?.enabled &&
    cfg?.apiKey?.trim() &&
    line &&
    ((line.path?.length ?? 0) >= 2 || (line.markers?.length ?? 0) > 0)
  )
}

function getIframe() {
  const el = webviewRef.value?.$el ?? webviewRef.value
  if (!el) return null
  return el.querySelector?.('iframe') || el.querySelector?.('uni-web-view') || el.firstElementChild
}

function postToWebView(payload) {
  // #ifdef H5
  nextTick(() => {
    const iframe = getIframe()
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      {
        type: 'duimai-amap',
        ...payload,
      },
      '*',
    )
  })
  // #endif
}

function pushMapState() {
  if (props.loading) return
  if (!canShowAmap()) {
    error.value =
      props.line && (props.line.path?.length ?? 0) < 2 && !(props.line.markers?.length)
        ? '暂无该线路 GIS 数据，请联系赛事运营配置赛道'
        : '高德地图未配置或暂无线路数据'
    return
  }
  error.value = null
  postToWebView({
    action: 'update',
    amapCfg: props.amapCfg,
    line: props.line,
    markerHeat: props.markerHeat,
    selectedMarkerId: props.selectedMarkerId ?? null,
  })
}

function onWebViewMessage(e) {
  const list = e.detail?.data
  const msg = Array.isArray(list) ? list[list.length - 1] : list
  handleHostMessage(msg)
}

function handleHostMessage(msg) {
  if (!msg) return
  if (msg.action === 'markerSelect') {
    emit('select-marker', msg.markerId ?? null)
  }
  if (msg.action === 'error') {
    error.value = msg.message || '地图加载失败'
  }
  if (msg.action === 'ready') {
    error.value = null
  }
  if (msg.action === 'bridgeReady') {
    bridgeReady.value = true
    pushMapState()
  }
}

function onWindowMessage(e) {
  if (e.data?.source === 'duimai-amap-webview') {
    handleHostMessage(e.data)
  }
}

watch(
  () => [props.line, props.amapCfg, props.markerHeat, props.selectedMarkerId, props.loading],
  () => pushMapState(),
  { deep: true },
)

onMounted(() => {
  // #ifdef H5
  window.addEventListener('message', onWindowMessage)
  setTimeout(pushMapState, 600)
  // #endif
})

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('message', onWindowMessage)
  // #endif
})
</script>

<style scoped>
.map-wrap {
  width: 100%;
  height: 420rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: #e2e8f0;
  position: relative;
}
.webview {
  width: 100%;
  height: 100%;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: #64748b;
  background: #f1f5f9;
  z-index: 1;
}
</style>
