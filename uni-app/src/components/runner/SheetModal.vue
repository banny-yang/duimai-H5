<template>
  <view v-if="show" class="sheet-mask" @tap="onClose" @touchmove.stop.prevent="noop">
    <view class="sheet-panel" @tap.stop>
      <view class="sheet-header">
        <text class="sheet-title">{{ title }}</text>
        <view class="sheet-close" @tap="onClose">
          <text class="sheet-close-icon">×</text>
        </view>
      </view>
      <view class="sheet-body" :class="{ 'sheet-body--scroll': scrollable }">
        <slot />
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: '' },
  /** 长内容（地图列表等）才开启内部滚动；表单弹窗务必为 false */
  scrollable: { type: Boolean, default: true },
})
const emit = defineEmits(['close'])

function onClose() {
  emit('close')
}

function noop() {}
</script>

<style scoped>
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
}
.sheet-panel {
  width: 100%;
  max-width: 428px;
  max-height: 85vh;
  max-height: 85dvh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -8rpx 40rpx rgba(15, 23, 42, 0.12);
}
.sheet-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid rgba(229, 231, 235, 0.9);
  background: #fff;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--ink, #1a1a1a);
}
.sheet-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12rpx;
}
.sheet-close-icon {
  font-size: 44rpx;
  line-height: 1;
  color: #94a3b8;
  font-weight: 300;
}
.sheet-body {
  flex-shrink: 1;
  min-height: 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-body--scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
