<template>
  <view class="h5-root picker-page" :style="pageStyle">
    <!-- 标题栏：Logo + 品牌 -->
    <view class="picker-header">
      <view class="picker-header-row">
        <view class="picker-logo-mark">麦</view>
        <view class="picker-header-text">
          <text class="picker-title">对麦智能 · 选手助手</text>
        </view>
      </view>
    </view>

    <!-- 赛事列表 -->
    <scroll-view class="picker-list" scroll-y>
      <!-- 加载中 -->
      <view v-if="loading" class="picker-state">
        <view class="spinner" />
        <text class="picker-state-text">正在加载赛事…</text>
      </view>

      <!-- 加载失败 -->
      <view v-else-if="error" class="picker-state picker-state--error">
        <text class="picker-state-icon">!</text>
        <text class="picker-state-title">加载失败</text>
        <text class="picker-state-desc">{{ error }}</text>
        <button class="picker-retry-btn" @tap="retry">重试</button>
      </view>

      <!-- 暂无赛事 -->
      <view v-else-if="items.length === 0" class="picker-state">
        <text class="picker-state-icon picker-state-icon--empty">—</text>
        <text class="picker-state-title">暂无可选赛事</text>
        <text class="picker-state-desc">平台暂无审核通过并已上线的赛事，可联系赛事主办方或通过赛事码进入</text>
      </view>

      <!-- 赛事卡片 -->
      <view
        v-for="ev in items"
        :key="ev.eventGuid"
        class="picker-card"
        :class="cardClass(ev)"
        @tap="go(ev.eventGuid)"
      >
        <view class="picker-card-top">
          <view class="picker-card-name-row">
            <text class="picker-card-name">{{ ev.eventName }}</text>
            <view v-if="isRace(ev)" class="picker-card-dot" />
          </view>
          <PhaseBadge :phase="phaseOf(ev)" />
        </view>
        <text v-if="phaseHint(ev)" class="picker-card-hint">{{ phaseHint(ev) }}</text>
        <view v-if="formatDate(ev.eventDate) || ev.location" class="picker-card-meta-row">
          <text v-if="formatDate(ev.eventDate)" class="picker-card-meta">{{ formatDate(ev.eventDate) }}</text>
          <text v-if="ev.location" class="picker-card-meta">{{ ev.location }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部区域：GUID 入口 + 提示 -->
    <view class="picker-bottom">
      <view class="picker-guid-row">
        <input
          v-model="guidInput"
          class="picker-guid-input"
          placeholder="输入赛事 GUID 快速进入"
        />
        <button class="picker-guid-btn" @tap="enterGuid">进入</button>
      </view>
      <text class="picker-footer-hint">也可通过赛事二维码或链接直接进入</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import PhaseBadge from '@/components/runner/PhaseBadge.vue'
import {
  fetchSelectableEvents,
  isEventPublicGuid,
  navigateToRunner,
} from '@/utils/runner-api.js'
import { resolveH5Phase } from '@/utils/event-phase.js'
import { ApiError, API_BASE } from '@/utils/api.js'
import { DEFAULT_SHARE_TITLE, enableMpShareMenu } from '@/utils/mp-share.js'

import { getMpPageMinHeightStyle, getMpCapsuleRightGapPx, getMpCapsuleNavBarHeightPx, isMpWeixinPlatform } from '@/utils/mp-layout.js'

const items = ref([])
const loading = ref(true)
const error = ref(null)
const guidInput = ref('')
const apiBase = API_BASE
const pageStyle = ref({})

onLoad((query) => {
  // #ifdef MP-WEIXIN
  enableMpShareMenu()
  // #endif
  if (isMpWeixinPlatform()) {
    pageStyle.value = getMpPageMinHeightStyle()
    const capsuleGap = getMpCapsuleRightGapPx()
    const capsuleNavH = getMpCapsuleNavBarHeightPx()
    let statusBarH = 0
    try { statusBarH = uni.getSystemInfoSync().statusBarHeight || 0 } catch { /* ignore */ }
    pageStyle.value = {
      ...pageStyle.value,
      ...(statusBarH > 0 ? { '--mp-status-bar-h': `${statusBarH}px` } : {}),
      ...(capsuleGap > 0 ? { '--mp-capsule-right-gap': `${capsuleGap}px` } : {}),
      ...(capsuleNavH > 0 ? { '--mp-capsule-nav-h': `${capsuleNavH}px` } : {}),
    }
  }
  // #ifdef H5
  pageStyle.value = { ...pageStyle.value, paddingTop: 'var(--status-bar-height)' }
  // #endif
  const g = query?.eventGuid?.trim()
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

function retry() {
  loadEvents()
}

function phaseOf(ev) {
  return resolveH5Phase({
    eventDate: ev.eventDate,
    eventStatus: ev.status,
    apiPhase: ev.phase,
  })
}

function isRace(ev) {
  return phaseOf(ev) === 'race'
}

function isPost(ev) {
  return phaseOf(ev) === 'post'
}

/**
 * 赛事卡片的阶段提示文字
 * - 赛前：距比赛还有 X 天
 * - 赛中：比赛进行中
 * - 赛后：赛事已结束
 */
function phaseHint(ev) {
  const phase = phaseOf(ev)
  if (phase === 'race') return '比赛进行中'
  if (phase === 'post') return '赛事已结束'
  // 赛前：尝试计算距离比赛天数
  if (ev.eventDate) {
    const days = daysUntil(ev.eventDate)
    if (days > 0) return `距比赛还有 ${days} 天`
    if (days === 0) return '比赛就在今天'
  }
  return ''
}

/**
 * 计算距离目标日期的天数（以本地日期计）
 */
function daysUntil(iso) {
  if (!iso) return -1
  const target = new Date(`${iso.trim()}T12:00:00`)
  if (Number.isNaN(target.getTime())) return -1
  const today = new Date()
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.ceil((targetDay - todayDay) / 86400000)
}

/**
 * 赛事卡片的视觉权重 class
 * - race（进行中）：高亮
 * - post（已结束）：降透明度
 */
function cardClass(ev) {
  const phase = phaseOf(ev)
  if (phase === 'race') return 'picker-card--active'
  if (phase === 'post') return 'picker-card--finished'
  return ''
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function go(guid) {
  navigateToRunner(guid)
}

function enterGuid() {
  const g = guidInput.value.trim()
  if (!isEventPublicGuid(g)) {
    uni.showToast({ title: '请输入有效赛事 GUID', icon: 'none' })
    return
  }
  navigateToRunner(g)
}
</script>

<style scoped>
/* ========================================
   卡片头部
   ======================================== */
.picker-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.picker-card-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

/* 进行中赛事的脉冲圆点 */
.picker-card-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
  animation: picker-pulse 1.8s ease-in-out infinite;
}

@keyframes picker-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ========================================
   卡片阶段提示
   ======================================== */
.picker-card-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: var(--secondary-text);
}


/* ========================================
   卡片元信息行
   ======================================== */
.picker-card-meta-row {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

/* ========================================
   卡片视觉权重
   ======================================== */

/* 进行中：主题色左边框 + 微背景 */
.picker-card--active {
  border-left: 6rpx solid var(--primary) !important;
  background: var(--primary-surface) !important;
}

/* 已结束：降透明度 */
.picker-card--finished {
  opacity: 0.55;
}

/* ========================================
   GUID 入口按钮
   ======================================== */
.picker-guid-btn {
  margin-top: 0;
  height: auto;
  line-height: normal;
  padding: 16rpx 28rpx;
  font-size: 26rpx;
  background: var(--primary);
  color: #fff;
  border-radius: 14rpx;
  font-weight: 600;
}

/* ========================================
   状态提示（加载/空/错误）
   ======================================== */
.picker-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx 40rpx;
}

.picker-state-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: var(--secondary-text);
}

.picker-state--error {
  background: #fffbf5;
  border: 1px solid #fed7aa;
  border-radius: 24rpx;
  margin: 0 24rpx;
  padding: 48rpx 32rpx;
}

.picker-state-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 800;
}

.picker-state--error .picker-state-icon {
  background: #fff7ed;
  color: #ea580c;
}

.picker-state-icon--empty {
  background: #f1f5f9;
  color: #94a3b8;
}

.picker-state-title {
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--ink);
}

.picker-state-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--secondary-text);
  text-align: center;
  line-height: 1.6;
}

.picker-retry-btn {
  margin-top: 28rpx;
  padding: 16rpx 48rpx;
  border-radius: 999rpx;
  background: var(--primary);
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
}
</style>
