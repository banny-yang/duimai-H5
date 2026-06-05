<template>
  <view class="h5-root picker-page" :style="pageStyle">
    <view class="picker-header">
      <text class="picker-brand">对麦智能 · 选手助手</text>
      <text class="picker-title">选择赛事</text>
      <text class="picker-desc">仅展示平台审核通过并已上线的赛事</text>
    </view>

    <view class="picker-guid-row">
      <input
        v-model="guidInput"
        class="picker-guid-input"
        placeholder="或输入赛事 GUID"
      />
      <button class="btn-primary picker-guid-btn" @tap="enterGuid">进入</button>
    </view>

    <scroll-view class="picker-list" scroll-y>
      <view v-if="loading" class="picker-center">
        <view class="spinner" />
        <text style="margin-top: 24rpx">正在加载赛事…</text>
      </view>
      <view v-else-if="error" class="picker-error">
        <text>{{ error }}</text>
        <text class="picker-desc" style="margin-top: 12rpx">请确认选手端服务（8091）已启动</text>
      </view>
      <view v-else-if="items.length === 0" class="picker-center">
        <text>暂无可选赛事</text>
      </view>
      <view
        v-for="ev in items"
        :key="ev.eventGuid"
        class="picker-card"
        @tap="go(ev.eventGuid)"
      >
        <view class="picker-card-top">
          <text class="picker-card-name">{{ ev.eventName }}</text>
          <PhaseBadge :phase="phaseOf(ev)" />
        </view>
        <text v-if="formatDate(ev.eventDate)" class="picker-card-meta">{{ formatDate(ev.eventDate) }}</text>
        <text v-if="ev.location" class="picker-card-meta">{{ ev.location }}</text>
      </view>
    </scroll-view>

    <text class="picker-footer-hint">也可通过赛事二维码或链接直接进入</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PhaseBadge from '@/components/runner/PhaseBadge.vue'
import {
  fetchSelectableEvents,
  isEventPublicGuid,
  navigateToRunner,
} from '@/utils/runner-api.js'
import { resolveH5Phase } from '@/utils/event-phase.js'
import { ApiError, API_BASE } from '@/utils/api.js'

import { getMpPageMinHeightStyle, isMpWeixinPlatform } from '@/utils/mp-layout.js'

const items = ref([])
const loading = ref(true)
const error = ref(null)
const guidInput = ref('')
const apiBase = API_BASE
const pageStyle = ref({})

onLoad((query) => {
  if (isMpWeixinPlatform()) {
    pageStyle.value = getMpPageMinHeightStyle()
  }
  const g = query?.eventGuid?.trim()
  if (g && isEventPublicGuid(g)) {
    navigateToRunner(g)
  }
})

onMounted(async () => {
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
})

function phaseOf(ev) {
  return resolveH5Phase({
    eventDate: ev.eventDate,
    eventStatus: ev.status,
    apiPhase: ev.phase,
  })
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
.picker-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}
.picker-guid-btn {
  margin-top: 0;
  height: auto;
  line-height: normal;
  padding: 16rpx 28rpx;
  font-size: 26rpx;
}
</style>
