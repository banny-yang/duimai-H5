<template>
  <SheetModal :show="show" title="交通接驳与物资" @close="$emit('close')">
    <view v-if="loading" class="center">加载接驳信息…</view>
    <view v-else-if="error" class="err">{{ error }}</view>
    <view v-else-if="!config" class="center muted">暂无接驳数据，请稍后重试</view>
    <view v-else-if="!shuttleVisible" class="center muted">
      组委会暂未发布交通接驳信息，请咨询现场工作人员。
    </view>
    <template v-else>
      <text v-if="config.summary" class="summary">{{ config.summary }}</text>
      <text class="phase-hint">
        当前赛段：{{ phaseLabel }}
        <text v-if="showingAllPhases"> · 已显示全部赛段指引</text>
        <text v-else-if="displayItems.length !== (config.items?.length ?? 0)">
          · 显示 {{ displayItems.length }} 条相关指引
        </text>
      </text>
      <view v-if="displayItems.length === 0" class="center muted">
        暂无交通接驳条目
      </view>
      <view v-for="item in displayItems" :key="item.id" class="item">
        <view class="item-head">
          <text class="item-title">{{ item.title }}</text>
          <text v-if="item.phase && item.phase !== 'all'" class="phase-tag">
            {{ PHASE_LABELS[item.phase] }}
          </text>
        </view>
        <text v-if="item.detail" class="item-detail">{{ item.detail }}</text>
        <text v-if="item.time" class="item-time">{{ item.time }}</text>
      </view>
    </template>
  </SheetModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from './SheetModal.vue'
import { fetchEventShuttleConfig } from '@/utils/runner-api.js'
import {
  filterShuttleItemsByPhase,
  isShuttleVisible,
  normalizeShuttleConfig,
  PHASE_LABELS,
} from '@/utils/shuttle.js'

const props = defineProps({
  show: Boolean,
  eventGuid: String,
  phase: { type: String, default: 'pre' },
  /** 进入页时已预取的接驳配置（与 H5 一致，避免弹窗内才请求失败） */
  cachedConfig: { type: Object, default: null },
})
defineEmits(['close'])

const loading = ref(false)
const error = ref(null)
const config = ref(null)

async function loadConfig(guid) {
  loading.value = true
  error.value = null
  try {
    const fromCache = normalizeShuttleConfig(props.cachedConfig)
    if (fromCache && isShuttleVisible(fromCache)) {
      config.value = fromCache
      return
    }
    config.value = await fetchEventShuttleConfig(guid)
  } catch (e) {
    config.value = normalizeShuttleConfig(props.cachedConfig)
    if (!config.value) {
      error.value = e?.message || '加载失败'
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.show, props.eventGuid, props.cachedConfig],
  ([open, guid]) => {
    if (!open || !guid) return
    loadConfig(guid)
  },
)

const shuttleVisible = computed(() => isShuttleVisible(config.value))

const phaseItems = computed(() =>
  filterShuttleItemsByPhase(config.value?.items ?? [], props.phase),
)

const showingAllPhases = computed(
  () => phaseItems.value.length === 0 && (config.value?.items?.length ?? 0) > 0,
)

const displayItems = computed(() =>
  showingAllPhases.value ? config.value.items : phaseItems.value,
)

const phaseLabel = computed(() => PHASE_LABELS[props.phase] ?? props.phase)
</script>

<style scoped>
.center {
  text-align: center;
  padding: 48rpx 0;
  font-size: 26rpx;
  color: var(--secondary-text, #64748b);
}
.muted {
  line-height: 1.5;
}
.err {
  background: var(--verify-banner-bg, #fffbeb);
  border: 1px solid var(--verify-banner-border, #fde68a);
  padding: 20rpx;
  border-radius: 12rpx;
  color: var(--verify-banner-icon-color, #92400e);
  font-size: 26rpx;
}
.summary {
  font-size: 26rpx;
  color: var(--secondary-text, #475569);
  line-height: 1.6;
  margin-bottom: 20rpx;
  display: block;
}
.phase-hint {
  font-size: 22rpx;
  color: var(--secondary-text, #94a3b8);
  margin-bottom: 16rpx;
  display: block;
}
.item {
  border: 1px solid var(--secondary-border);
  background: var(--shuttle-item-bg, #f8fafc);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}
.item-title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--ink);
}
.phase-tag {
  flex-shrink: 0;
  font-size: 20rpx;
  font-weight: 600;
  color: var(--primary-dark);
  background: var(--primary-surface);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.item-detail {
  font-size: 26rpx;
  color: var(--secondary-text, #64748b);
  margin-top: 8rpx;
  display: block;
  line-height: 1.5;
}
.item-time {
  font-size: 22rpx;
  color: var(--primary-dark);
  font-weight: 600;
  margin-top: 8rpx;
  display: block;
}
</style>
