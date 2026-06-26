<template>
  <view class="gateway-page" :style="pageStyle">
    <!-- 1. Hero -->
    <view class="gateway-hero">
      <view class="gateway-nav">
        <view class="gateway-brand">
          <view class="gateway-shield">DM</view>
          <view class="gateway-brand-text">
            <text class="gateway-brand-name">对麦智能</text>
            <text class="gateway-brand-sub">DUIMAI AI · 赛事数据审计网关</text>
          </view>
        </view>
      </view>

      <view class="gateway-hero-body">
        <text class="gateway-headline">
          面向万人大型赛事的
          <text class="gateway-headline-accent">全链路 AI 语音交互系统</text>
        </text>
        <text class="gateway-intro">
          高性能多 Key 轮询与大模型网关，串联选手端语音问答、舆情雷达与 SOS 安全熔断，保障赛道安全生命线。
        </text>
      </view>
    </view>

    <!-- 2. Feature matrix -->
    <scroll-view class="gateway-scroll" scroll-y :show-scrollbar="false">
      <view class="gateway-features">
        <view v-for="(f, i) in features" :key="i" class="gateway-feature-card">
          <view class="gateway-feature-icon" :class="f.iconClass">
            <text>{{ f.icon }}</text>
          </view>
          <view class="gateway-feature-body">
            <text class="gateway-feature-title">{{ f.title }}</text>
            <text class="gateway-feature-desc">{{ f.desc }}</text>
          </view>
        </view>

        <view v-if="loading" class="gateway-sync">
          <view class="spinner" />
          <text class="gateway-sync-text">正在同步已上线赛事…</text>
        </view>
        <view v-else-if="error" class="gateway-sync-error">
          <text>{{ error }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 3. Bottom gateway -->
    <view class="gateway-footer">
      <view class="gateway-search-wrap">
        <view
          v-if="showSuggest"
          class="gateway-suggest"
        >
          <view
            v-if="suggestions.length"
            v-for="ev in suggestions"
            :key="ev.eventGuid"
            class="gateway-suggest-item"
            @tap="go(ev.eventGuid)"
          >
            <view class="gateway-suggest-main">
              <text class="gateway-suggest-name">{{ ev.eventName }}</text>
              <text v-if="formatDate(ev.eventDate) || ev.location" class="gateway-suggest-meta">
                {{ formatDate(ev.eventDate) }}{{ ev.location ? ` · ${ev.location}` : '' }}
              </text>
            </view>
            <text class="gateway-suggest-tag">点击直达</text>
          </view>
          <view v-else class="gateway-suggest-empty">
            <text>未找到「{{ trimmedQuery }}」相关赛事</text>
            <text class="gateway-suggest-empty-sub">请检查名称，或扫描现场二维码进入</text>
          </view>
        </view>

        <view class="gateway-search-bar">
          <text class="gateway-search-icon">🔍</text>
          <input
            class="gateway-search-input"
            v-model="query"
            placeholder="输入赛事名称（如：无锡）"
            placeholder-class="gateway-search-ph"
            confirm-type="search"
            @focus="searchFocused = true"
            @blur="onSearchBlur"
            @confirm="handleConnect"
          />
          <button class="gateway-connect-btn" @tap="handleConnect">连线</button>
        </view>

        <button class="gateway-scan-btn" @tap="handleScan">
          <text class="gateway-scan-icon">📷</text>
          <text>扫描赛道现场专属二维码直达</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import {
  fetchSelectableEvents,
  isEventPublicGuid,
  navigateToRunner,
  parseEventGuidFromText,
} from '@/utils/runner-api.js'
import { ApiError } from '@/utils/api.js'
import { DEFAULT_SHARE_TITLE, enableMpShareMenu } from '@/utils/mp-share.js'
import {
  getMpCustomNavStyleVars,
  getMpPageMinHeightStyle,
  isMpWeixinPlatform,
} from '@/utils/mp-layout.js'

const features = [
  {
    icon: '🎙️',
    iconClass: 'gateway-feature-icon--blue',
    title: '毫秒级高风噪语音网关',
    desc: '针对山地风噪与高喘息环境深度优化，多 Key 轮询保障万人并发下语音转写稳定可达。',
  },
  {
    icon: '📊',
    iconClass: 'gateway-feature-icon--green',
    title: '实时热点舆情雷达大屏',
    desc: '基于 Redis 高并发聚类算法，5 分钟滑动窗口内自动提炼断水、物资紧缺等赛道群体性痛点。',
  },
  {
    icon: '🚨',
    iconClass: 'gateway-feature-icon--orange',
    title: '高危安全护栏与秒级响应',
    desc: '内置医疗救援（MEDICAL）与极端情绪（ANGRY）拦截机制，秒级拉响 WebSocket 弹窗警报。',
  },
]

const items = ref([])
const loading = ref(true)
const error = ref(null)
const query = ref('')
const searchFocused = ref(false)
const pageStyle = ref({})

const trimmedQuery = computed(() => query.value.trim())
const showSuggest = computed(() => searchFocused.value && trimmedQuery.value.length > 0)

const suggestions = computed(() => {
  if (!trimmedQuery.value) return []
  const q = trimmedQuery.value.toLowerCase()
  return items.value
    .filter((ev) => ev.eventName.toLowerCase().includes(q))
    .slice(0, 8)
})

onLoad((opts) => {
  // #ifdef MP-WEIXIN
  enableMpShareMenu()
  // #endif
  if (isMpWeixinPlatform()) {
    pageStyle.value = {
      ...getMpPageMinHeightStyle(),
      ...getMpCustomNavStyleVars(),
    }
  }
  // #ifdef H5
  pageStyle.value = { ...pageStyle.value, paddingTop: 'var(--status-bar-height)' }
  // #endif
  const g = opts?.eventGuid?.trim()
  if (g && isEventPublicGuid(g)) {
    navigateToRunner(g)
  }
})

// #ifdef MP-WEIXIN
onShareAppMessage(() => ({
  title: DEFAULT_SHARE_TITLE,
  path: '/pages/index',
}))

onShareTimeline(() => ({
  title: DEFAULT_SHARE_TITLE,
  query: '',
}))
// #endif

onMounted(() => {
  loadEvents()
})

async function loadEvents() {
  loading.value = true
  error.value = null
  try {
    items.value = await fetchSelectableEvents()
  } catch (e) {
    error.value =
      e instanceof ApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : '无法加载赛事列表'
  } finally {
    loading.value = false
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function go(guid) {
  searchFocused.value = false
  query.value = ''
  navigateToRunner(guid)
}

function onSearchBlur() {
  setTimeout(() => {
    searchFocused.value = false
  }, 150)
}

function handleConnect() {
  if (suggestions.value.length === 1) {
    go(suggestions.value[0].eventGuid)
    return
  }
  const guid = parseEventGuidFromText(trimmedQuery.value)
  if (guid) {
    go(guid)
    return
  }
  if (suggestions.value.length > 1) {
    searchFocused.value = true
    uni.showToast({ title: '请从列表选择赛事', icon: 'none' })
    return
  }
  uni.showToast({ title: '未找到匹配赛事', icon: 'none' })
}

function handleScan() {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success(res) {
      const guid = parseEventGuidFromText(res.result || '')
      if (!guid) {
        uni.showToast({ title: '未能识别赛事二维码', icon: 'none' })
        return
      }
      go(guid)
    },
    fail() {
      uni.showToast({ title: '扫码已取消', icon: 'none' })
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showModal({
    title: '粘贴赛事链接',
    editable: true,
    placeholderText: '二维码链接或赛事 GUID',
    success(res) {
      if (!res.confirm) return
      const guid = parseEventGuidFromText(res.content || '')
      if (!guid) {
        uni.showToast({ title: '未能识别赛事链接', icon: 'none' })
        return
      }
      go(guid)
    },
  })
  // #endif
}
</script>

<style scoped>
.gateway-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.gateway-hero {
  flex-shrink: 0;
  background: linear-gradient(135deg, #172554 0%, #1e3a8a 45%, #1e40af 100%);
  color: #fff;
}

/* 顶部品牌行：高度对齐微信胶囊导航区，内容不超过胶囊高度 */
.gateway-nav {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: calc(var(--mp-status-bar-h, 0px) + var(--mp-capsule-nav-h, 88rpx));
  padding: var(--mp-status-bar-h, 0px) var(--mp-capsule-right-gap, 32rpx) 0 32rpx;
}

/* #ifndef MP-WEIXIN */
.gateway-nav {
  height: auto;
  min-height: 88rpx;
  padding: calc(24rpx + env(safe-area-inset-top)) 32rpx 0;
}
/* #endif */

.gateway-brand {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
  min-width: 0;
  max-height: var(--mp-capsule-h, 64rpx);
  overflow: hidden;
}

.gateway-shield {
  width: var(--mp-capsule-h, 64rpx);
  height: var(--mp-capsule-h, 64rpx);
  max-width: var(--mp-capsule-h, 64rpx);
  max-height: var(--mp-capsule-h, 64rpx);
  border-radius: calc(var(--mp-capsule-h, 32px) * 0.22);
  border: 2rpx solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--mp-capsule-h, 32px) * 0.34);
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  box-sizing: border-box;
}

.gateway-brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  max-height: var(--mp-capsule-h, 64rpx);
  overflow: hidden;
}

.gateway-brand-name {
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gateway-brand-sub {
  margin-top: 2rpx;
  font-size: 18rpx;
  font-weight: 500;
  color: rgba(191, 219, 254, 0.9);
  letter-spacing: 0.02em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gateway-hero-body {
  padding: 28rpx 32rpx 40rpx;
}

.gateway-headline {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.45;
  letter-spacing: -0.02em;
}

.gateway-headline-accent {
  background: linear-gradient(90deg, #67e8f9 0%, #6ee7b7 100%);
  -webkit-background-clip: text;
  color: transparent;
}

.gateway-intro {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 1.65;
  color: rgba(219, 234, 254, 0.88);
}

.gateway-scroll {
  flex: 1;
  height: 0;
  padding-bottom: 360rpx;
}

.gateway-features {
  padding: 28rpx 28rpx 16rpx;
}

.gateway-feature-card {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: #fff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 8rpx 48rpx rgba(15, 23, 42, 0.06);
}

.gateway-feature-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.gateway-feature-icon--blue {
  background: #eff6ff;
}

.gateway-feature-icon--green {
  background: #ecfdf5;
}

.gateway-feature-icon--orange {
  background: #fff7ed;
}

.gateway-feature-body {
  flex: 1;
  min-width: 0;
}

.gateway-feature-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.35;
}

.gateway-feature-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #64748b;
}

.gateway-sync {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.gateway-sync-text {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #64748b;
}

.gateway-sync-error {
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: #fffbeb;
  border: 1px solid #fde68a;
  font-size: 24rpx;
  color: #92400e;
  line-height: 1.5;
}

.gateway-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 24rpx 28rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #f1f5f9;
  box-shadow: 0 -8rpx 32rpx rgba(15, 23, 42, 0.08);
}

.gateway-search-wrap {
  position: relative;
}

.gateway-suggest {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 112rpx;
  z-index: 50;
  max-height: 420rpx;
  overflow-y: auto;
  border-radius: 32rpx;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.12);
}

.gateway-suggest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx 28rpx;
  border-bottom: 1px solid #f1f5f9;
}

.gateway-suggest-item:last-child {
  border-bottom: none;
}

.gateway-suggest-item:active {
  background: #f8fafc;
}

.gateway-suggest-main {
  flex: 1;
  min-width: 0;
}

.gateway-suggest-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gateway-suggest-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gateway-suggest-tag {
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
}

.gateway-suggest-empty {
  padding: 36rpx 28rpx;
  text-align: center;
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.6;
}

.gateway-suggest-empty-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.gateway-search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 20rpx;
  border-radius: 32rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
}

.gateway-search-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.gateway-search-input {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 28rpx;
  color: #1a1a1a;
  background: transparent;
}

.gateway-connect-btn {
  flex-shrink: 0;
  margin: 0;
  padding: 0 28rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.25);
}

.gateway-scan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  border: 2rpx dashed #cbd5e1;
  background: #fff;
  font-size: 28rpx;
  font-weight: 500;
  color: #475569;
}

.gateway-scan-icon {
  font-size: 32rpx;
}

.spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6rpx solid #2563eb;
  border-top-color: transparent;
  border-radius: 50%;
  animation: gateway-spin 0.8s linear infinite;
}

@keyframes gateway-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.gateway-search-ph {
  color: #94a3b8;
  font-size: 28rpx;
}
</style>
